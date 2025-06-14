import { CurrenciesEntity } from "../../entity/CurrenciesEntity";
import { CoincheckCoinType } from "../../infrastructure/api/types/CoinTypes";
import * as dotenv from "dotenv";
import { MaService } from "./MaService";
import { CoincheckTradeConfig } from "../types/CoincheckTradeConfig";
import { autoTradeLogger } from "../../infrastructure/logger/AutoTradeLogger";
dotenv.config();

/**
 * 移動平均線戦略の実装
 * 短期移動平均線が長期移動平均線を上抜けたら買い、下抜けたら売り
 */
export class CoincheckMaService extends MaService {

  /**
   * トレードの実行関数
   * @param marketId 
   * @param currency 
   */
  async execute(marketId: number, currency: CurrenciesEntity): Promise<void> {

    // 市場銘柄情報の取得
    const marketCurrencies = await this.marketCurrenciesRepository.selectMarketCurrency(marketId, currency?.currency_id);

    // コインの現在の価格を取得
    const currentPrice = await this.client.getCurrentPrice(currency.symbol as CoincheckCoinType);

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
        // すでに買ってたらスルー
        const openOrders = await this.client.getOpenOrders();
        const sellingOrder = openOrders.orders.filter(order => order.pair === currency.symbol && order.order_type == "buy")
        if (sellingOrder.length > 0) {
          autoTradeLogger.info(`CoincheckMaServiceクラス → コイン種類: ${currency.symbol}はすでに買っているのでスルー`);
          return;
        }
        // 購入量を計算
        const amount = await this.calculateBuyAmount(currentPrice, currency.symbol as CoincheckCoinType, Number(marketCurrencies.percent));
        // 購入
        const orderResult = await this.client.createOrder({
          rate: currentPrice,
          amount: amount,
          order_type: 'buy',
          pair: `${currency.symbol}_jpy`
        });
        // 取引履歴を追加
        await this.transactionsRepository.insertTransaction(
          marketId,
          currency?.currency_id,
          'buy',
          amount,
          currentPrice,
          currentPrice * amount,
          orderResult.id
        )
        // ゴールデンクロスの状態に変更
        await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "golden");
      }
      // デッドクロス（短期MAが長期MAを下抜き）
      else if (shortMA < longMA && currentPrice <= shortMA && crossStatus !== "dead") {
        // 注文をキャンセル
        const openOrders = await this.client.getOpenOrders();
        openOrders.orders.filter(order => order.pair === currency.symbol).forEach(async (order) => {
          // 注文をキャンセル
          await this.client.deleteOpenOrder(order.id);
          // 取引履歴を更新
          await this.transactionsRepository.updateActiveFlag(order.id, 0);
        });
        // 売却量を計算
        const amount = await this.calculateSellAmount(currency.symbol as CoincheckCoinType);
        if (amount === 0) {
        // 売却量が0場合スルー
          return;
        }
        // 売却
        const orderResult = await this.client.createOrder({
          rate: currentPrice,
          amount: amount,
          order_type: 'sell',
          pair: `${currency.symbol}_jpy`
        });
        // 取引履歴を追加
        await this.transactionsRepository.insertTransaction(
          marketId,
          currency?.currency_id,
          'sell',
          amount,
          currentPrice,
          currentPrice * amount,
          orderResult.id
        )
        // デッドクロスの状態に変更
        await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "dead");
      } else {
        // 移動平均線が交差していない場合は何もしない
        autoTradeLogger.info(`CoincheckMaServiceクラス → コイン種類: ${currency.symbol}|${crossStatus} 現在の価格: ${currentPrice}、短期MA：${shortMA}、長期MA：${longMA} - 交差なし`);
      }
    }
  }

  /**
   *  投資額を計算するメソッド（円でコインを買う）
   *  
   * @param currentPrice 
   * @returns 
   */
  private async calculateBuyAmount(currentPrice: number, coinType: CoincheckCoinType, percent: number): Promise<number> {
    /** 現在保持している円の合計 */
    const yenBalance = await this.client.getYenBalance();
    // リスクを加味して現在所持する円のうち[RISK_PERSENT]%分の円を使う
    const riskInvestYen = yenBalance * percent / 100;
    const config = this.tradeConfig.find(config => config.coinType === coinType);
    if (!config) {
      throw new Error(`tradeConfigが見つかりません: ${coinType}`);
    }
    // 購入量を計算
    const amount = Math.floor(riskInvestYen / currentPrice * Math.pow(10, config.decimal)) / Math.pow(10, config.decimal);

    if (amount < config.minimunTradeAmount) {
      if (yenBalance > config.minimunTradeAmount * currentPrice) {
        // 買えるならかっちゃう
        return config.minimunTradeAmount * currentPrice;
      } else {
        // 0.01未満の場合はエラーにする
        throw new Error(`${coinType}の購入量が${config.minimunTradeAmount}未満です。現在の価格: ${currentPrice}, 購入量: ${amount}`);
      }
    } else {
      // 購入量が0.01以上の場合はそのまま返す
      return amount;
    }
  }


  /**
   *  投資額を計算するメソッド（コインを売って円に変える）
   *  
   * @param currentPrice 
   * @returns 
   */
  private async calculateSellAmount(coinType: CoincheckCoinType): Promise<number> {
    /** 現在保持しているETHの合計 */
    const coinBalance = await this.client.getCoinBalance(coinType);
    return coinBalance;
  }

  private tradeConfig: CoincheckTradeConfig[] = [
    {
      coinType: "btc",
      minimunTradeAmount: 0.001,
      decimal: 8,
    },
    {
      coinType: "bril",
      minimunTradeAmount: 1.0,
      decimal: 2,
    },
    {
      coinType: "wbtc",
      minimunTradeAmount: 0.001,
      decimal: 8,
    },
    {
      coinType: "lsk",
      minimunTradeAmount: 1.0,
      decimal: 2,
    },
    {
      coinType: "mona",
      minimunTradeAmount: 1.0,
      decimal: 2,
    },
    {
      coinType: "dai",
      minimunTradeAmount: 1.0,
      decimal: 2,
    },
    {
      coinType: "fnct",
      minimunTradeAmount: 100,
      decimal: 0,
    },
    {
      coinType: "etc",
      minimunTradeAmount: 1.0,
      decimal: 2,
    },
    {
      coinType: "eth",
      minimunTradeAmount: 0.01,
      decimal: 5,
    },
    {
      coinType: "xrp",
      minimunTradeAmount: 1.0,
      decimal: 2,
    },
    {
      coinType: "shib",
      minimunTradeAmount: 1000,
      decimal: 0,
    },
    {
      coinType: "xem",
      minimunTradeAmount: 1,
      decimal: 0,
    },
    {
      coinType: "iost",
      minimunTradeAmount: 1,
      decimal: 0,
    },
    {
      coinType: "enj",
      minimunTradeAmount: 1.0,
      decimal: 2,
    },
    {
      coinType: "bc",
      minimunTradeAmount: 100,
      decimal: 0,
    },
    {
      coinType: "avax",
      minimunTradeAmount: 0.1,
      decimal: 1,
    },
    {
      coinType: "bch",
      minimunTradeAmount: 0.01,
      decimal: 2,
    },
    {
      coinType: "imx",
      minimunTradeAmount: 1,
      decimal: 0,
    },
    {
      coinType: "chz",
      minimunTradeAmount: 100,
      decimal: 0,
    },
    {
      coinType: "doge",
      minimunTradeAmount: 1,
      decimal: 0,
    },
    {
      coinType: "pepe",
      minimunTradeAmount: 1000,
      decimal: 0,
    },
    {
      coinType: "mask",
      minimunTradeAmount: 1,
      decimal: 0,
    },
    {
      coinType: "mana",
      minimunTradeAmount: 1,
      decimal: 0,
    },
    {
      coinType: "grt",
      minimunTradeAmount: 1,
      decimal: 0,
    },
  ];
}