import { BinanceClient } from "../../infrastructure/api/BinanceClient";
import { CoinCheckClient } from "../../infrastructure/api/CoinCheckClient";
import { CoincheckCoinType } from "../../infrastructure/api/types/CoinTypes";
import { CurrenciesRepository } from "../../repository/CurrenciesRepository";
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

  constructor(private marketId: number) {
    this.transactionsRepository = new TransactionsRepository();
    this.currenciesRepository = new CurrenciesRepository();
    this.binanceClient = new BinanceClient(
      process.env.BINANCE_API_KEY!,
      process.env.BINANCE_SECRET_KEY!
    );
  }

  /**
   * 再トレードの実行関数
   * @returns 
   */
  async execute(): Promise<void> {
    const openOrders = await this.binanceClient.getAllOpenOrders();
    for (const order of openOrders) {
      try {
        // 現在の価格を取得;
        const currentPrice = await this.binanceClient.getCurrentPrice(order.symbol);
        if (order.price == currentPrice) {
          console.log(`現在価格と注文価格が一致しているため、再トレードを実行しません。コイン：${order.symbol}|${order.price}、注文日時： ${order.time}、現在価格: ${currentPrice}、注文時価: ${order.price}`);
          continue;
        }
        // まずは注文をキャンセル
        const deleteResult = await this.binanceClient.cancelOrder(order.symbol, order.orderId);
        if (deleteResult.success === false) {
          console.error('オープンオーダーのキャンセルに失敗しました', deleteResult);
          continue;
        }
        if (order.executedQty > 0) {
          // 約定済みの注文量がある場合、取引履歴を更新
          await this.transactionsRepository.updateQuantity(order.orderId, order.executedQty);
          console.log(`約定済みの注文量を更新: ${order.symbol}|${order.side}|約定済み量: ${order.executedQty}|元の注文量: ${order.origQty}`);
        } else {
          // 約定済みの注文量がない場合、アクティブフラグを0にする
          await this.transactionsRepository.updateActiveFlag(order.orderId, 0);
          console.log(`アクティブフラグを0に更新: ${order.symbol}|${order.side}|約定済み量: ${order.executedQty}|元の注文量: ${order.origQty}`);
        }
        // 注文キャンセル後、1秒待機
        // await new Promise(resolve => setTimeout(resolve, 1000));
        // 再トレードを実行
        const orderResult = await this.binanceClient.createOrder(
          order.symbol,
          order.side,
          order.origQty - order.executedQty,
          currentPrice
        );
        // 再トレードの結果を取引履歴に追加
        const currency = await this.currenciesRepository.selectBySymbol(order.symbol);
        await this.transactionsRepository.insertTransaction(this.marketId, currency.currency_id, order.side, order.origQty - order.executedQty, currentPrice, currentPrice * (order.origQty - order.executedQty), orderResult.orderId);
        console.log(`再トレード実行: ${order.symbol}|${order.side}|約定済み量: ${order.executedQty}|元の注文量: ${order.origQty}|価格: ${currentPrice}`);
      } catch (error) {
        console.error('再トレードの実行に失敗しました', error);
      }
    };
  }
}