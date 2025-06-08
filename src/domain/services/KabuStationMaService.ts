import { CurrenciesEntity } from "../../entity/CurrenciesEntity";
import * as dotenv from "dotenv";
import { MaService } from "./MaService";
import { KabuStationClient } from "../../infrastructure/api/KabuStationClient";
import { KabuStationCoinType } from "../../infrastructure/api/types/CoinTypes";
import { KabuStationTradeConfig } from "../types/KabuStationTradeConfig";

dotenv.config();

/**
 * kabuステーション用の移動平均線戦略の実装
 * 短期移動平均線が長期移動平均線を上抜けたら買い、下抜けたら売り
 */
export class KabuStationMaService extends MaService {

  private kabuStationClient: KabuStationClient;
  
    constructor(coinName: KabuStationCoinType) {
      super(coinName);
      this.kabuStationClient = new KabuStationClient(
        process.env.KABU_STATION_API_PASSWORD_PROD!,
      );
    }

  /**
   * トレードの実行関数
   * @param marketId 
   * @param currency 
   */
  async execute(marketId: number, currency: CurrenciesEntity): Promise<void> {

    // 市場銘柄情報の取得
    const marketCurrencies = await this.marketCurrenciesRepository.selectMarketCurrency(marketId, currency?.currency_id);

    // kabuステーションで現在の株価を取得
    const currentPrice = await this.kabuStationClient.getCurrentPrice(currency.symbol);

    // 価格を登録
    await this.marketPriceRepository.insertMarketPrice(marketId, currency?.currency_id, currentPrice);

    // 過去の価格を取得
    const marketPrices = await this.marketPriceRepository.selectPriceLatest(marketId, currency?.currency_id, marketCurrencies.long_term + 1);

    // 長期移動平均の計算に必要なデータが溜まったら処理開始
    if (marketPrices.length > marketCurrencies.long_term) {
      // 移動平均計算
      const shortMA = this.calculateMA(marketCurrencies.short_term, marketPrices);
      const longMA = this.calculateMA(marketCurrencies.long_term, marketPrices);

      const crossStatus = await this.marketCurrenciesRepository.selectCrossStatus(marketId, currency?.currency_id);

      if (shortMA > longMA && currentPrice >= shortMA && marketPrices[0] > marketPrices[1] && marketPrices[1] > marketPrices[2] && crossStatus !== "golden") {
        // ゴールデンクロスの状態に変更
        await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "golden");
        // すでに買ってたらスルー
        const openOrders = await this.kabuStationClient.getOpenOrders();
        const buyingOrder = openOrders.filter(order => order.Symbol == currency.symbol && order.State == 3); // 3: 発注済みで処理中
        if (buyingOrder.length > 0) {
          console.log(`KabuStationMaServiceクラス → 銘柄: ${currency.symbol}はすでに買っているのでスルー`);
          return;
        }
        // 購入量を計算
        const amount = await this.calculateBuyAmount(currentPrice, currency.symbol, Number(marketCurrencies.percent));
        // 購入
        const orderResult = await this.kabuStationClient.createOrder({
          symbol: currency.symbol,
          price: currentPrice,
          quantity: amount,
          side: "buy", // 1: buy
        });
        // 取引履歴を追加
        await this.transactionsRepository.insertTransaction(
          marketId,
          currency?.currency_id,
          'buy',
          amount,
          currentPrice,
          currentPrice * amount,
          orderResult.OrderId
        )
      }
      // デッドクロス（短期MAが長期MAを下抜き）
      else if (shortMA < longMA && currentPrice <= shortMA && crossStatus !== "dead") {
        // デッドクロスの状態に変更
        await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "dead");
        // 注文をキャンセル
        const openOrders = await this.kabuStationClient.getOpenOrders();
        openOrders.filter(order => order.Symbol == currency.symbol).forEach(async (order) => {
          // 注文をキャンセル
          await this.kabuStationClient.cancelOrder(order.ID);
          // 取引履歴を更新
          await this.transactionsRepository.updateActiveFlag(order.ID, 0);
        });
        // 売却量を計算
        const amount = await this.calculateSellAmount(currency.symbol);
        if (amount === 0) {
          // 売却量が0場合スルー
          return;
        }
        // 売却
        const orderResult = await this.kabuStationClient.createOrder({
          symbol: currency.symbol,
          price: currentPrice,
          quantity: amount,
          side: "sell", // 2: sell
        });
        // 取引履歴を追加
        await this.transactionsRepository.insertTransaction(
          marketId,
          currency?.currency_id,
          'sell',
          amount,
          currentPrice,
          currentPrice * amount,
          orderResult.OrderId
        )
      } else {
        // 移動平均線が交差していない場合は何もしない
        console.log(`KabuStationMaServiceクラス → 銘柄: ${currency.symbol}|${crossStatus} 現在の価格: ${currentPrice}、短期MA：${shortMA}、長期MA：${longMA} - 交差なし`);
      }
    }
  }

  /**
   *  投資額を計算するメソッド（円で株を買う）
   *  
   * @param currentPrice 
   * @returns 
   */
  private async calculateBuyAmount(currentPrice: number, symbol: string, percent: number): Promise<number> {
    /** 現在保持している円の合計 */
    const yenBalance = await this.kabuStationClient.getYenBalance();
    // リスクを加味して現在所持する円のうち[percent]%分の円を使う
    const riskInvestYen = yenBalance * percent / 100;
    const config = this.tradeConfig.find(config => config.symbol === symbol);
    if (!config) {
      throw new Error(`tradeConfigが見つかりません: ${symbol}`);
    }
    // 株は単元株数でしか買えないので、単元株数で割る
    const lot = config.lotsize;
    const maxLots = Math.floor(riskInvestYen / (currentPrice * lot));
    if (maxLots < 1) {
      throw new Error(`${symbol}の購入量が単元株数未満です。現在の価格: ${currentPrice}, 投資可能額: ${riskInvestYen}`);
    }
    return maxLots * lot;
  }

  /**
   *  売却量を計算するメソッド（保有株数を売る）
   *  
   * @param symbol 
   * @returns 
   */
  private async calculateSellAmount(symbol: string): Promise<number> {
    /** 現在保持している株数の合計 */
    const stockBalance = await this.kabuStationClient.getAssetBalance(symbol);
    return stockBalance;
  }

  private tradeConfig: KabuStationTradeConfig[] = [
    {
      symbol: "151",
      lotsize: 100, // 日経225連動型上場投資信託
    }
    // {
    //   symbol: "7203", // トヨタ自動車
    //   lotSize: 100,
    // },
    // {
    //   symbol: "7203", // トヨタ自動車
    //   lotSize: 100,
    // },
    // {
    //   symbol: "9432", // NTT
    //   lotSize: 100,
    // },
    // {
    //   symbol: "8306", // 三菱UFJ
    //   lotSize: 100,
    // },
    // 必要に応じて追加
  ];
}