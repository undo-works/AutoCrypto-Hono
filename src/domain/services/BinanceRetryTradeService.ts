import { BINANCE_TRADE_CONFIG } from "../../constants";
import { BinanceClient } from "../../infrastructure/api/BinanceClient";
import { CoinCheckClient } from "../../infrastructure/api/CoinCheckClient";
import { CoincheckCoinType } from "../../infrastructure/api/types/CoinTypes";
import { errorLogger } from "../../infrastructure/logger/ErrorLogger";
import { autoTradeLogger } from "../../infrastructure/logger/AutoTradeLogger";
import { CurrenciesRepository } from "../../repository/CurrenciesRepository";
import { MarketCurrenciesRepository } from "../../repository/MarketCurrenciesRepository";
import { TransactionsRepository } from "../../repository/TransactionsRepository";


/**
 * 再トレード戦略の実装
 * 未成約の注文がある場合、現在価格で再トレードを実行する
 */
export class BinanceRetryTradeService {

  /** コインチェックの取引 */
  private binanceClient: BinanceClient;
  /** 取引リポジトリ */
  private transactionsRepository: TransactionsRepository;
  /** 銘柄リポジトリ */
  private currenciesRepository: CurrenciesRepository;
  /** 市場銘柄リポジトリ */
  private MarketCurrenciesRepository: MarketCurrenciesRepository;

  constructor() {
    this.transactionsRepository = new TransactionsRepository();
    this.currenciesRepository = new CurrenciesRepository();
    this.MarketCurrenciesRepository = new MarketCurrenciesRepository();
    this.binanceClient = new BinanceClient(
      process.env.BINANCE_API_KEY!,
      process.env.BINANCE_SECRET_KEY!
    );
  }

  /**
   * 再トレードの実行関数
   * @returns 
   */
  async execute(marketId: number): Promise<void> {
    const openOrders = await this.binanceClient.getAllOpenOrders();
    for (const order of openOrders) {
      try {
        // 現在の価格を取得;
        const currentPrice = await this.binanceClient.getCurrentPrice(order.symbol);
        if (order.price == currentPrice) {
          autoTradeLogger.info(`現在価格と注文価格が一致しているため、再トレードを実行しません。コイン：${order.symbol}|${order.price}、注文日時： ${order.time}、現在価格: ${currentPrice}、注文時価: ${order.price}`);
          continue;
        }
        // まずは注文をキャンセル
        const deleteResult = await this.binanceClient.cancelOrder(order.symbol, order.orderId);
        if (deleteResult.success === false) {
          errorLogger.error('オープンオーダーのキャンセルに失敗しました', deleteResult);
          continue;
        }
        if (order.executedQty > 0) {
          // 約定済みの注文量がある場合、取引履歴を更新
          await this.transactionsRepository.updateQuantity(order.orderId, order.executedQty);
          autoTradeLogger.info(`約定済みの注文量を更新: ${order.symbol}|${order.side}|約定済み量: ${order.executedQty}|元の注文量: ${order.origQty}`);
        } else {
          // 約定済みの注文量がない場合、アクティブフラグを0にする
          await this.transactionsRepository.updateActiveFlag(order.orderId, 0);
          autoTradeLogger.info(`アクティブフラグを0に更新: ${order.symbol}|${order.side}|約定済み量: ${order.executedQty}|元の注文量: ${order.origQty}`);
        }
        // 注文キャンセル後、1秒待機
        // await new Promise(resolve => setTimeout(resolve, 1000));
        /** 購入or売却する量 */
        let orderQuantity = order.origQty - order.executedQty;
        /** 現在保持しているBNBの合計 */
        const bnbBalance = await this.binanceClient.getCoinBalance('BNB');
        /** トレードの設定値を取得 */
        const tradeConfig = BINANCE_TRADE_CONFIG.find(config => config.coinType === order.symbol);
        if (tradeConfig?.baseCoin === "BNB" && order.side === 'SELL' && bnbBalance < orderQuantity) {
          // BNB基準の売却の時 かつ  BNB残高 < 売却量(BNB) の場合
          // orderQuanntity(BNB)をBNB残高に変更
          orderQuantity = Math.floor(bnbBalance / tradeConfig.stepSize) * tradeConfig.stepSize;
        } else if (tradeConfig?.tradeCoin === "BNB" && order.side === 'BUY' && bnbBalance < orderQuantity * currentPrice) {
          // コイン基準の購入の時 かつ BNB残高 < 購入量(コイン) * 現在価格(BNB/コイン) の場合
          // orderQuanntity(コイン)をBNB残高 * 現在価格(コイン/BNB) に変更
          orderQuantity = Math.floor(bnbBalance * currentPrice / tradeConfig.stepSize) * tradeConfig.stepSize;
        }
        const decimals = (tradeConfig!.stepSize.toString().split('.')[1] || '').length;
        orderQuantity = Math.floor(orderQuantity * Math.pow(10, decimals)) / Math.pow(10, decimals);
        autoTradeLogger.info(`調整後の購入量: ${orderQuantity} coin | decimals: ${decimals}`);

        // 銘柄情報を取得
        const currency = await this.currenciesRepository.selectBySymbol(order.symbol);
        if (orderQuantity <= (tradeConfig?.minNotional ?? 0)) {
          autoTradeLogger.info(`再トレードの量が${tradeConfig?.minNotional ?? 0}以下になったため、再トレードをスキップします。コイン：${order.symbol}|注文量: ${orderQuantity}|BNB残高: ${bnbBalance}|現在価格: ${currentPrice}`);
          const marketCurrenciesRepository = new MarketCurrenciesRepository();
          // クロスフラグをnullに設定
          await marketCurrenciesRepository.upsertMarketCurrencies(marketId, currency.currency_id, null);
          continue;
        }
        // 再トレードを実行
        const orderResult = await this.binanceClient.createOrder(
          order.symbol,
          order.side,
          orderQuantity,
          currentPrice
        );

        if (tradeConfig?.baseCoin == "BNB") {
          // 現在価格(bnb/coin)を反転する -> coin/bnb
          const reversePrice = 1 / currentPrice;
          // quantity(コインの量) -> bnb ÷ 現在価格(bnb/coin)
          // price per unit(コインの価格) -> 反転した価格(coin/bnb)
          // total amount -> BNBの量を渡せばよい
          await this.transactionsRepository.insertTransaction(marketId, currency.currency_id, order.side, orderQuantity / currentPrice, reversePrice, orderQuantity, orderResult.orderId);
          autoTradeLogger.info(`再トレード実行: ${order.symbol}|${order.side}|約定済み量: ${order.executedQty}|元の注文量: ${order.origQty}|価格: ${currentPrice}`);
        } else {
          await this.transactionsRepository.insertTransaction(marketId, currency.currency_id, order.side, orderQuantity, currentPrice, currentPrice * orderQuantity, orderResult.orderId);
          autoTradeLogger.info(`再トレード実行: ${order.symbol}|${order.side}|約定済み量: ${order.executedQty}|元の注文量: ${order.origQty}|価格: ${currentPrice}`);
        }

      } catch (error) {
        if (error instanceof Error) {
          errorLogger.error(error.message);
        } else {
          errorLogger.error(String(error));
        }
      }
    };
  }
}