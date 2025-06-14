import { BINANCE_TRADE_CONFIG } from "../../constants";
import { CurrenciesEntity } from "../../entity/CurrenciesEntity";
import { MarketCurrenciesEntity } from "../../entity/MarketCurrenciesEntity";
import { BinanceClient } from "../../infrastructure/api/BinanceClient";
import { BinanceCoinType } from "../../infrastructure/api/types/CoinTypes";
import { BinanceTradeConfig } from "../types/BinanceTradeConfig";
import { MaService } from "./MaService";

export class BinanceMaService extends MaService {
  private binanceClient: BinanceClient;

  constructor(coinName: BinanceCoinType) {
    super(coinName);
    this.binanceClient = new BinanceClient(
      process.env.BINANCE_API_KEY!,
      process.env.BINANCE_SECRET_KEY!
    );
  }

  async execute(marketId: number, currency: CurrenciesEntity): Promise<void> {

    // 市場銘柄情報の取得
    const marketCurrencies = await this.marketCurrenciesRepository.selectMarketCurrency(marketId, currency?.currency_id);

    /** コインの現在の価格を取得(coin/bnb) */
    const marketPrice = await this.binanceClient.getCurrentPrice(currency.symbol);

    // コインの取引設定を取得
    const config = BINANCE_TRADE_CONFIG.find(config => config.coinType == currency.symbol);

    if (config?.baseCoin === "BNB") {
      // BNBを基準にした取引を実行
      await this.executeBnbBasedTrade(marketId, currency, marketCurrencies, marketPrice);
    }
    else {
      // コインを基準にした取引を実行
      await this.executeCoinBasedTrade(marketId, currency, marketCurrencies, marketPrice);
    }
  }

  /**
   * BNBを基準にした取引を実行するメソッド
   * コインの価格が1BNBあたり何コインかの表記になってる銘柄
   * @param marketId 
   * @param currency 
   * @param marketCurrency 
   * @param marketPrice 
   * @param config 
   * @returns 
   */
  private executeBnbBasedTrade = async (marketId: number, currency: CurrenciesEntity, marketCurrency: MarketCurrenciesEntity, marketPrice: number): Promise<void> => {
    /**
     * BNBを基準にしているので、価格を1/コイン価格に変換
     * 1コイン当たり何BNBかをもとに計算を進める(bnb/coin)
     */
    const currentPrice = 1 / marketPrice;

    // 価格を登録
    await this.marketPriceRepository.insertMarketPrice(marketId, currency?.currency_id, currentPrice);

    // 過去の価格を取得
    const marketPrices = await this.marketPriceRepository.selectPriceLatest(marketId, currency?.currency_id, marketCurrency.long_term + 1);

    // 長期移動平均の計算に必要なデータが溜まったら処理開始
    if (marketPrices.length > marketCurrency.long_term) {
      // 移動平均計算
      const shortMA = this.calculateMA(marketCurrency.short_term, marketPrices);
      const longMA = this.calculateMA(marketCurrency.long_term, marketPrices);

      const crossStatus = await this.marketCurrenciesRepository.selectCrossStatus(marketId, currency?.currency_id);

      // 24時間の価格変動を取得
      const priceChangeData = await this.binanceClient.get24hPriceChangePercent(currency.symbol);
      if (!priceChangeData) {
        console.error(`BinanceMaServiceクラス → 価格変動データが取得できませんでした: ${currency.symbol}`);
        return;
      }

      // 最終取引を取得（売ってよいかを確認するときに使う）
      const lastTrade = await this.binanceClient.getRecentTrades(currency.symbol);

      // 24hで何パーセント上がっているときならBNB → コインに替えてよいか
      // 取引%が20以上だったら1% 10%以上なら3%、それ以下なら5%（取引%を信用度として利用）
      const btocThreshold = Number(marketCurrency.percent) > 20 ? 0.5 : Number(marketCurrency.percent) > 10 ? 1 : 1.5;

      // コイン購入時から比較した価格の上昇率：デッドクロスでの比較に利用
      const overBuyPrice = lastTrade.length > 0 && lastTrade[0]?.isMaker === true ? lastTrade[0].price / marketPrice : null;

      // ゴールデンクロス（短期MAが長期MAを上抜き）
      if (shortMA > longMA // 短期MAが長期MAを上抜き
        && currentPrice >= shortMA // 現在価格が短期MA以上
        && marketPrices[0] > marketPrices[1] && marketPrices[1] > marketPrices[2] // 価格が上昇傾向にある
      // && btocThreshold < priceChangeData.priceChangePercent //BNB基準の時は24hの価格変動率が正に大きいとき、コインの価値が落ちてる
        && crossStatus !== "golden") {
        // すでに買ってたらスルー
        const openOrders = await this.binanceClient.getOpenOrder(currency.symbol);
        if (openOrders.length > 0) {
          console.log(`BinanceMaServiceクラス → コイン種類: ${currency.symbol}はすでに買っているのでスルー`);
          return;
        }
        // 購入量を計算
        const { coinAmount, bnbAmount } = await this.calculateBuyAmountByBNB(currentPrice, Number(marketCurrency.percent));
        // coinAmountがconfigの条件内に収まるように調整
        const config = BINANCE_TRADE_CONFIG.find(cfg => cfg.coinType === currency.symbol);
        if (!config) {
          console.error(`tradeConfigが見つかりません: ${currency.symbol}`);
          return;
        }
        // 最小・最大・stepSizeで調整
        let adjustedCoinAmount = bnbAmount;
        // stepSizeに合わせて切り捨て
        adjustedCoinAmount = Math.floor(adjustedCoinAmount / config.stepSize) * config.stepSize;
        const decimals = (config.stepSize.toString().split('.')[1] || '').length;
        adjustedCoinAmount = Math.floor(adjustedCoinAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
        console.log(`調整後の購入量: ${adjustedCoinAmount} coin | decimals: ${decimals}`);

        if (adjustedCoinAmount < config.minQty) {
          // 売却量が最小取引量未満の場合スルー
          console.log(`BinanceMaServiceクラス → コイン種類: ${currency.symbol}の購入量(${adjustedCoinAmount})が最小取引量(${config.minQty})未満のためスルーします。`);
          return;
        }
        if (adjustedCoinAmount * marketPrice < config.minNotional) {
          // 売却総額が最小取引総額未満の場合スルー
          console.log(`コイン種類: ${currency.symbol}の売却総額(${adjustedCoinAmount * marketPrice})が最小取引総額(${config.minNotional})未満のためスルーします`);
          return;
        }
        // 購入
        const orderResult = await this.binanceClient.createOrder(
          currency.symbol,
          'SELL', // BNBベースなので「売り」
          adjustedCoinAmount, // BNBの量を指定
          marketPrice // 1BNB当たりの価格を指定
        );
        // 取引履歴を追加
        await this.transactionsRepository.insertTransaction(
          marketId,
          currency?.currency_id,
          'buy',
          coinAmount, // 購入するコインの量
          currentPrice, // 1コイン当たりのBNB価格(bnb/coin)
          currentPrice * coinAmount, // 購入に使ったBNBの量
          orderResult?.orderId
        )
        // ゴールデンクロスの状態に変更
        await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "golden");
        console.log(`コイン種類: ${currency.symbol}を購入しました。購入量: ${coinAmount} coin、価格: ${currentPrice} bnb/coin、shortMA: ${shortMA}, longMA: ${longMA}、 価格変動率: ${priceChangeData.priceChangePercent}%`);
      }
      // デッドクロス（短期MAが長期MAを下抜き）
      else if (shortMA < longMA
        && currentPrice <= shortMA
      // && (overBuyPrice === null || overBuyPrice > 1.005)
        && crossStatus !== "dead") {
        // // 注文をキャンセル
        // const openOrders = await this.binanceClient.getOpenOrders();
        // openOrders.orders.filter(order => order.pair === currency.symbol).forEach(async (order) => {
        //   // 注文をキャンセル
        //   await this.binanceClient.deleteOpenOrder(order.id);
        //   // 取引履歴を更新
        //   await this.transactionsRepository.updateActiveFlag(order.id, 0);
        // });
        // 売却量を計算
        const { coinAmount, bnbAmount } = await this.calculateSellAmount(currency.symbol, currentPrice);
        if (bnbAmount === 0) {
          // 売却量が0場合スルー
          console.log(`コイン種類: ${currency.symbol}の売却量が0のためスルーしてデッドクロスに変更します`);
          await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "dead");
          return;
        }
        // 売却
        const orderResult = await this.binanceClient.createOrder(
          currency.symbol,
          'BUY', // BNBを「購入」してコインを放す
          bnbAmount, // BNBの量を指定
          marketPrice // 1BNB当たりの価格を指定
        );
        // 取引履歴を追加
        await this.transactionsRepository.insertTransaction(
          marketId,
          currency?.currency_id,
          'sell',
          coinAmount,
          currentPrice,
          currentPrice * coinAmount,
          orderResult?.orderId
        )
        // デッドクロスの状態に変更
        await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "dead");
        console.log(`コイン種類: ${currency.symbol}を売却しました。購入量: ${coinAmount} coin、価格: ${currentPrice} bnb/coin、shortMA: ${shortMA}, longMA: ${longMA}、 価格変動率: ${priceChangeData.priceChangePercent}%、価格上昇度：${overBuyPrice}`);
      } else {
        // 移動平均線が交差していない場合は何もしない
        console.log(`コイン種類: ${currency.symbol}、価格: ${currentPrice} bnb/coin、shortMA: ${shortMA}, longMA: ${longMA}、 価格変動率: ${priceChangeData.priceChangePercent}%、価格上昇度：${overBuyPrice}`);
      }
    }
  }

  private executeCoinBasedTrade = async (marketId: number, currency: CurrenciesEntity, marketCurrency: MarketCurrenciesEntity, marketPrice: number): Promise<void> => {
    // 価格を登録
    await this.marketPriceRepository.insertMarketPrice(marketId, currency?.currency_id, marketPrice);

    // 過去の価格を取得
    const marketPrices = await this.marketPriceRepository.selectPriceLatest(marketId, currency?.currency_id, marketCurrency.long_term + 1);

    // 長期移動平均の計算に必要なデータが溜まったら処理開始
    if (marketPrices.length > marketCurrency.long_term) {
      // 移動平均計算
      const shortMA = this.calculateMA(marketCurrency.short_term, marketPrices);
      const longMA = this.calculateMA(marketCurrency.long_term, marketPrices);

      const crossStatus = await this.marketCurrenciesRepository.selectCrossStatus(marketId, currency?.currency_id);

      // 24時間の価格変動を取得
      const priceChangeData = await this.binanceClient.get24hPriceChangePercent(currency.symbol);
      if (!priceChangeData) {
        console.error(`BinanceMaServiceクラス → 価格変動データが取得できませんでした: ${currency.symbol}`);
        return;
      }

      // 最終取引を取得（売ってよいかを確認するときに使う）
      const lastTrade = await this.binanceClient.getRecentTrades(currency.symbol);

      // 24hで何パーセント下がったらBNB → コインに替えてよいか：ゴールデンクロスでの比較に利用
      // 取引%が20以上だったら-1% 10%以上なら-3%、それ以下なら-5%
      const btocThreshold = Number(marketCurrency.percent) > 20 ? -0.5 : Number(marketCurrency.percent) > 10 ? -1 : -1.5;

      // コイン購入時から比較した価格の上昇率：デッドクロスでの比較に利用
      const overBuyPrice = lastTrade.length > 0 && lastTrade[0]?.isBuyer === true ? marketPrice / lastTrade[0].price : null;

      // ゴールデンクロス（短期MAが長期MAを上抜き）
      if (shortMA > longMA // 短期MAが長期MAを上抜き
        && marketPrice >= shortMA // 現在価格が短期MA以上
        && marketPrices[0] > marketPrices[1] && marketPrices[1] > marketPrices[2] // 価格が上昇傾向にある
      // && btocThreshold > priceChangeData.priceChangePercent // 負の方向の価格変動率が大きいとき
        && crossStatus !== "golden") {
        // すでに買ってたらスルー
        const openOrders = await this.binanceClient.getOpenOrder(currency.symbol);
        if (openOrders.length > 0) {
          console.log(`BinanceMaServiceクラス → コイン種類: ${currency.symbol}はすでに買っているのでスルー`);
          return;
        }
        // 購入量を計算
        const { coinAmount, bnbAmount } = await this.calculateBuyAmountByBNB(marketPrice, Number(marketCurrency.percent));
        // coinAmountがconfigの条件内に収まるように調整
        const config = BINANCE_TRADE_CONFIG.find(cfg => cfg.coinType === currency.symbol);
        if (!config) {
          console.error(`tradeConfigが見つかりません: ${currency.symbol}`);
          return;
        }
        // 最小・最大・stepSizeで調整
        let adjustedCoinAmount = coinAmount;
        // stepSizeに合わせて切り捨て
        adjustedCoinAmount = Math.floor(adjustedCoinAmount / config.stepSize) * config.stepSize;
        const decimals = (config.stepSize.toString().split('.')[1] || '').length;
        adjustedCoinAmount = Math.floor(adjustedCoinAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
        console.log(`調整後の購入量: ${adjustedCoinAmount} coin | decimals: ${decimals}`);

        if (adjustedCoinAmount < config.minQty) {
          // 購入量が最小取引量未満の場合スルー
          console.log(`コイン種類: ${currency.symbol}の購入量(${adjustedCoinAmount})が最小取引量(${config.minQty})未満のためスルーします。`);
          return;
        }
        if (adjustedCoinAmount * marketPrice < config.minNotional) {
          // 購入総額が最小取引総額未満の場合スルー
          console.log(`コイン種類: ${currency.symbol}の購入総額(${adjustedCoinAmount * marketPrice})が最小取引総額(${config.minNotional})未満のためスルーします`);
          return;
        }
        // 購入
        const orderResult = await this.binanceClient.createOrder(
          currency.symbol,
          "BUY", // BNBを使ってコインを買う
          adjustedCoinAmount, // コインの量を指定
          marketPrice // 1BNB当たりの価格を指定
        );
        // 取引履歴を追加
        await this.transactionsRepository.insertTransaction(
          marketId,
          currency?.currency_id,
          'buy',
          adjustedCoinAmount, // 購入するコインの量
          marketPrice, // 1コイン当たりのBNB価格(bnb/coin)
          marketPrice * bnbAmount, // 購入に使ったBNBの量
          orderResult?.orderId
        )
        // ゴールデンクロスの状態に変更
        await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "golden");
        console.log(`コイン種類: ${currency.symbol}を購入しました。購入量: ${coinAmount} coin、価格: ${marketPrice} bnb/coin、shortMA: ${shortMA}, longMA: ${longMA}、 価格変動率: ${priceChangeData.priceChangePercent}%`);
      }
      // デッドクロス（短期MAが長期MAを下抜き）
      else if (shortMA < longMA
        && marketPrice <= shortMA
      // && (overBuyPrice === null || overBuyPrice > 1.002) // コイン購入時から比較して価格が0.2%以上上昇している場合は売ってよい
        && crossStatus !== "dead") {
        // // 注文をキャンセル
        // const openOrders = await this.binanceClient.getOpenOrders();
        // openOrders.orders.filter(order => order.pair === currency.symbol).forEach(async (order) => {
        //   // 注文をキャンセル
        //   await this.binanceClient.deleteOpenOrder(order.id);
        //   // 取引履歴を更新
        //   await this.transactionsRepository.updateActiveFlag(order.id, 0);
        // });
        // 売却量を計算
        const { coinAmount, bnbAmount } = await this.calculateSellAmount(currency.symbol, marketPrice);
        // coinAmountがconfigの条件内に収まるように調整
        const config = BINANCE_TRADE_CONFIG.find(cfg => cfg.coinType === currency.symbol);
        if (!config) {
          console.error(`tradeConfigが見つかりません: ${currency.symbol}`);
          return;
        }
        // 最小・最大・stepSizeで調整
        let adjustedCoinAmount = coinAmount;
        // stepSizeに合わせて切り捨て
        adjustedCoinAmount = Math.floor(adjustedCoinAmount / config.stepSize) * config.stepSize;
        const decimals = (config.stepSize.toString().split('.')[1] || '').length;
        adjustedCoinAmount = Math.floor(adjustedCoinAmount * Math.pow(10, decimals)) / Math.pow(10, decimals);
        console.log(`調整後の購入量: ${adjustedCoinAmount} coin | decimals: ${decimals}`);

        if (adjustedCoinAmount < config.minQty) {
        // 売却量が最小取引量未満の場合スルー
          console.log(`コイン種類: ${currency.symbol}の売却量(${adjustedCoinAmount})が最小取引量(${config.minQty})未満のためスルーしてデッドクロスに変更します`);
          await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "dead");
          return;
        }
        if (adjustedCoinAmount * marketPrice < config.minNotional) {
          // 売却量が最小取引総額未満の場合スルー
          console.log(`コイン種類: ${currency.symbol}の売却総額(${adjustedCoinAmount * marketPrice})が最小取引総額(${config.minNotional})未満のためスルーしてデッドクロスに変更します`);
          await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "dead");
          return;
        }
        // 売却
        const orderResult = await this.binanceClient.createOrder(
          currency.symbol,
          "SELL", // BNBを「購入」してコインを放す
          adjustedCoinAmount, // BNBの量を指定
          marketPrice // 1BNB当たりの価格を指定
        );
        // 取引履歴を追加
        await this.transactionsRepository.insertTransaction(
          marketId,
          currency?.currency_id,
          'sell',
          adjustedCoinAmount,
          marketPrice,
          marketPrice * coinAmount,
          orderResult?.orderId
        )
        // デッドクロスの状態に変更
        await this.marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency?.currency_id, "dead");
        console.log(`コイン種類: ${currency.symbol}を売却しました。購入量: ${coinAmount} coin、価格: ${marketPrice} bnb/coin、shortMA: ${shortMA}, longMA: ${longMA}、 価格変動率: ${priceChangeData.priceChangePercent}%、価格上昇度：${overBuyPrice}`);
      } else {
        // 移動平均線が交差していない場合は何もしない
        console.log(`コイン種類: ${currency.symbol}。価格: ${marketPrice} bnb/coin、shortMA: ${shortMA}, longMA: ${longMA}、 価格変動率: ${priceChangeData.priceChangePercent}%、価格上昇度：${overBuyPrice}`);
      }
    }
  }


  /**
   *  投資額を計算するメソッド（BNBでコインを買う）
   *  
   * @param currentPrice (bnb/coin)
   * @param percent リスクを加味した投資割合（%）
   * @returns 購入するコインの量
   */
  private async calculateBuyAmountByBNB(currentPrice: number, percent: number): Promise<{ coinAmount: number, bnbAmount: number }> {
    /** 現在保持しているBNBの合計 */
    const bnbBalance = await this.binanceClient.getCoinBalance('BNB');
    if (bnbBalance === 0) {
      throw new Error('BNBの残高が0です。購入できません。');
    }
    const allBalance = await this.binanceClient.getTotalBalanceInBNB();
    console.log(`BNBの残高: ${bnbBalance} BNB、 全体の残高: ${allBalance} BNB`);
    // リスクを加味して現在所持する円のうち[RISK_PERSENT]%分の円を使う
    let riskInvestBnB = Math.floor(allBalance * percent / 100 * Math.pow(10, 3)) / Math.pow(10, 3);

    if (riskInvestBnB > bnbBalance) {
      // リスク投資額がBNBの残高を超える場合はBNBの残高を使う
      riskInvestBnB = bnbBalance;
      console.log(`BNBの残高を超えるため、リスク投資額をBNBの残高に調整しました: ${riskInvestBnB} BNB`);
    }
    // const config = this.tradeConfig.find(config => config.coinType === coinType);
    // if (!config) {
    //   throw new Error(`tradeConfigが見つかりません: ${coinType}`);
    // }
    // 購入量を計算
    // const amount = Math.floor(riskInvestYen / currentPrice * Math.pow(10, config.decimal)) / Math.pow(10, config.decimal);

    // if (amount < config.minimunTradeAmount) {
    //   if (bnbBalance > config.minimunTradeAmount * currentPrice) {
    //     // 買えるならかっちゃう
    //     return config.minimunTradeAmount * currentPrice;
    //   } else {
    //     // 0.01未満の場合はエラーにする
    //     throw new Error(`${coinType}の購入量が${config.minimunTradeAmount}未満です。現在の価格: ${currentPrice}, 購入量: ${amount}`);
    //   }
    // } else {
    //   // 購入量が0.01以上の場合はそのまま返す
    //   return amount;
    // }

    const coinAmount = Math.floor(riskInvestBnB / currentPrice * Math.pow(10, 3)) / Math.pow(10, 3);

    console.log(`消費するBNBの量: ${riskInvestBnB} BNB → 購入するコインの量: ${coinAmount} coin`);

    return { coinAmount: coinAmount, bnbAmount: riskInvestBnB }; // BNBを基準にしているので、購入するコインの量はBNBの量/現在価格(bnb/coin)
  }

  /**
   *  投資額を計算するメソッド（コインを売ってBNBに変える）
   *  
   * @param currentPrice (bnb/coin)
   * @param coinType コインの種類
   * @returns 
   */
  private async calculateSellAmount(coinType: string, currentPrice: number): Promise<{ coinAmount: number, bnbAmount: number }> {
    /**  */
    const config = BINANCE_TRADE_CONFIG.find(config => config.coinType === coinType);
    /** 現在保持しているコインの合計 */
    const coinBalance = await this.binanceClient.getCoinBalance(config?.tradeCoin! !== "BNB" ? config?.tradeCoin! : config?.baseCoin!);

    const bnbAmount = Math.floor(coinBalance * currentPrice * Math.pow(10, 3)) / Math.pow(10, 3);

    return { coinAmount: coinBalance, bnbAmount: bnbAmount }; // BNBを基準にしているので、売却するコインの量はコインの量*現在価格(bnb/coin)
  }
}