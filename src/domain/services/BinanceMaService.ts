import { BINANCE_COIN_TYPES } from "../../constants";
import { CurrenciesEntity } from "../../entity/CurrenciesEntity";
import { BinanceClient } from "../../infrastructure/api/BinanceClient";
import { BinanceCoinType } from "../../infrastructure/api/types/CoinTypes";
import { BinanceTradeConfig } from "../types/BinanceTradeConfig";
import { MaService } from "./MaService";

export class BinanceMaService extends MaService {
  private binanceClient: BinanceClient;

  /** 一番伸びてるコインの銘柄 */
  private topGoldenCross: BinanceCoinType | null = "BNBBTC";
  /** 一番伸びてるコインの銘柄 - BNB文字列 */
  private topGoldenCrossString: string | null = "BTC";

  constructor() {
    super("BNBBTC");
    this.binanceClient = new BinanceClient(
      process.env.BINANCE_API_KEY!,
      process.env.BINANCE_SECRET_KEY!
    );
  }

  async execute(marketId: number): Promise<void> {

    console.log(`BinanceMaServiceクラス → 前回までのトップコインは: ${this.topGoldenCross}`);

    /** 現在価格の一覧 */
    const allCurrentPrice = await this.binanceClient.getAllCurrentPrice();

    // 銘柄情報の取得
    const currencies = await this.currencyRepository.selectAll();

    /** コインの短期平均÷長期平均を保存 */
    const statusList: { coinType: BinanceCoinType, ratio: number }[] = [];

    for (const coinType of BINANCE_COIN_TYPES) {

      /** コインの現在の価格を取得 */
      const marketPrice = allCurrentPrice.find(price => price.symbol == coinType)?.price;

      const currency = currencies.find((currency) => currency.symbol == coinType);
      const config = this.tradeConfig.find(config => config.coinType == coinType);

      if (!currency || !config || !marketPrice) {
        throw new Error(`コイン種類: ${coinType}の情報が見つかりません`);
      }

      // 価格を登録
      await this.marketPriceRepository.insertMarketPrice(marketId, currency.currency_id, config.reverse ? 1 / marketPrice : marketPrice);

      // 市場銘柄情報の取得
      const marketCurrencies = await this.marketCurrenciesRepository.selectMarketCurrency(marketId, currency.currency_id);
      // 過去の価格を取得
      const marketPrices = await this.marketPriceRepository.selectPriceLatest(marketId, currency.currency_id, marketCurrencies.long_term + 1);

      // 長期移動平均の計算に必要なデータが溜まったら処理開始
      if (marketPrices.length > marketCurrencies.long_term) {
        // 移動平均計算
        const shortMA = this.calculateMA(marketCurrencies.short_term, marketPrices);
        const longMA = this.calculateMA(marketCurrencies.long_term, marketPrices);

        statusList.push({ coinType: coinType, ratio: shortMA / longMA }) // 短期MA / 長期MAの値を保存
        console.log(`BinanceMaServiceクラス → コイン種類: ${coinType}、短期MA: ${shortMA}、長期MA: ${longMA}、現在の価格: ${marketPrice}、 短期MA / 長期MA: ${shortMA / longMA}`);
      }
    }

    // 最も短期MA / 長期MAの値が大きいコインを取得
    const topCoinType = statusList.reduce((prev, current) => (prev.ratio > current.ratio) ? prev : current, statusList[0]);
    console.log(`BinanceMaServiceクラス → 今回のトップコインは: ${topCoinType.coinType}、短期MA / 長期MAの値: ${topCoinType.ratio}`);

    // オープン中オーダーの取得
    const openOrders = await this.binanceClient.getOpenOrders();

    if (this.topGoldenCross && this.topGoldenCross === topCoinType.coinType && topCoinType.ratio > 1) {
      // トップコインが変わっていない場合は、オープン中の注文を確認して再注文
      for (const order of openOrders) {
        const currentPrice = allCurrentPrice.find(price => price.symbol == order.symbol)?.price;
        if (order.price != currentPrice) {
          // 注文をキャンセル
          await this.binanceClient.cancelOrder(order.symbol, order.orderId);
          // 取引履歴を更新
          // await this.transactionsRepository.updateActiveFlag(order.orderId, 0);
          // 再注文
          await this.binanceClient.createOrder(
            order.symbol,
            order.side, // 注文のサイドをそのまま使用
            order.origQty, // 元の注文量を使用
            currentPrice! // 現在の価格で再注文
          );
        }
      }
    } else {
      // トップコインを更新
      this.topGoldenCross = topCoinType.ratio > 1 ? topCoinType.coinType : null; // 短期MA / 長期MAが1より大きい場合のみトップコインとする
      this.topGoldenCrossString = topCoinType.ratio > 1 ? this.topGoldenCross?.replace('BNB', '') ?? null : "BNB"; // BNBを除去した文字列
      console.log(`BinanceMaServiceクラス → トップコインを更新: ${this.topGoldenCross}`);
      for (const order of openOrders) {
        // 注文をキャンセル
        await this.binanceClient.cancelOrder(order.symbol, order.orderId);
        // 取引履歴を更新
        // await this.transactionsRepository.updateActiveFlag(order.orderId, 0);
      }
    }

    /** 現在保持しているコインの合計 */
    // ETHを売ってBNBに変えたいとき
    const allCoinBalance = await this.binanceClient.getAllCoinBalance();
    for (const balance of allCoinBalance.balances) {
      // トップコインと同じコイン or 残高がないコイン はスキップ
      if (balance.asset == this.topGoldenCrossString || balance.free == 0) continue;
      // 今のループのコインとトップコインの取引設定を取得
      const config = this.tradeConfig.find(config => (config.baseCoin == balance.asset && config.tradeCoin == this.topGoldenCrossString) || (config.baseCoin == this.topGoldenCrossString && config.tradeCoin == balance.asset));
      const currentPrice = allCurrentPrice.find(price => price.symbol == `${config?.coinType}`)?.price;
      const price = balance.asset !== config?.baseCoin ? 1 / currentPrice! : currentPrice!; // 価格を取得（BNB/coinの場合は逆数にする）
      // ベースのコインならそのままコインの価格をかける。逆だったらコイン量をそのまま売る(小数点の丸め処理をする)
      const coinAmount = config?.baseCoin == balance.asset ? Math.floor(balance.free / currentPrice! * Math.pow(10, 3)) / Math.pow(10, 3) : Math.floor(balance.free * Math.pow(10, 3)) / Math.pow(10, 3); // コインの量を取得（BNB/coinの場合はそのまま、coin/BNBの場合は価格を掛ける）
      console.log(`BinanceMaServiceクラス → コイン種類: ${config?.coinType}、価格: ${currentPrice}、量: ${coinAmount}`);
      // コインをトップコインに変換
      if (config && coinAmount > 0) {
        console.log(`BinanceMaServiceクラス → コイン種類: ${balance.asset}、売却量: ${coinAmount}、現在の価格: ${currentPrice}`);

        if (coinAmount * currentPrice! < config.minNotional) {
          console.log(`BinanceMaServiceクラス → コイン種類: ${balance.asset}の売却量(${coinAmount * currentPrice!})が最小取引額(${config.minNotional})を下回るためスキップ`);
          continue; // 最小取引額を下回る場合はスキップ
        }

        try {
          // 売却
          const orderResult = await this.binanceClient.createOrder(
            config.coinType,
            config.baseCoin !== balance.asset ? 'SELL' : 'BUY', // ベースコインを
            coinAmount, // コインの量を指定
            currentPrice! // 1コイン当たりのBNB価格(bnb/coin)
          );
          const currencyId = currencies.find(currency => currency.symbol == config.coinType)?.currency_id;
          // 取引履歴を追加
          await this.transactionsRepository.insertTransaction(
            marketId,
            currencyId!,
            config.baseCoin !== balance.asset ? 'SELL' : 'BUY', // BNBを「売却」してコインを得る
            coinAmount, // 購入するコインの量
            currentPrice!, // 1コイン当たりのBNB価格(bnb/coin)
            currentPrice! * coinAmount, // 購入に使ったBNBの量
            orderResult?.prepayId?.toString()
          )
        } catch (error) {
          console.error(`BinanceMaServiceクラス → コイン種類: ${balance.asset}の取引に失敗しました:`, error);
        }

      } else {
        console.log(`BinanceMaServiceクラス → コイン種類: ${balance.asset}は売却量が0のためスキップ`);
      }
    }
  }

  private tradeConfig: BinanceTradeConfig[] = [
    {
      coinType: "BNBBTC",
      baseCoin: "BTC",
      tradeCoin: "BNB",
      reverse: true,
      minNotional: 0.0001,
    },
    {
      coinType: "BNBETH",
      baseCoin: "ETH",
      tradeCoin: "BNB",
      reverse: true,
      minNotional: 0.001,
    },
    {
      coinType: "BNBJPY",
      baseCoin: "JPY",
      tradeCoin: "BNB",
      reverse: true,
      minNotional: 1000,
    },
    {
      coinType: "BTCJPY",
      baseCoin: "JPY",
      tradeCoin: "BTC",
      reverse: null,
      minNotional: 1000,
    },
    {
      coinType: "ETHBTC",
      baseCoin: "BTC",
      tradeCoin: "ETH",
      reverse: null,
      minNotional: 0.0001,
    },
    {
      coinType: "ETHJPY",
      baseCoin: "JPY",
      tradeCoin: "ETH",
      reverse: null,
      minNotional: 1000,
    },
  ]
}