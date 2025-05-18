import { CoinCheckClient } from "../../infrastructure/api/CoinCheckClient";
import { CoinType } from "../../infrastructure/api/types/CoinTypes";
import { MaService } from "./MaService";


/**
 * 再トレード戦略の実装
 * 未成約の注文がある場合、現在価格で再トレードを実行する
 */
export class CoincheckRetryTradeService {

  /** コインチェックの取引 */
  private client: CoinCheckClient;

  constructor() {
    this.client = new CoinCheckClient(
      process.env.COINCHECK_ACCESS_KEY!,
      process.env.COINCHECK_SECRET_ACCESS_KEY!
    );
  }

  /**
   * 再トレードの実行関数
   * @returns 
   */
  async execute(): Promise<void> {
    const openOrders = await this.client.getOpenOrders();
    if (openOrders.success === false) {
      console.error('オープンオーダーの取得に失敗しました');
      return;
    }
    openOrders.orders.forEach(async (order) => {
      try {
        // まずは注文をキャンセル
        const deleteResult = await this.client.deleteOpenOrder(order.id);
        if (deleteResult.success === false) {
          console.error('オープンオーダーのキャンセルに失敗しました', deleteResult);
          return;
        }
        // 現在の価格を取得
        const pairWithoutJpy = order.pair.replace(/_jpy$/i, '');
        const currentPrice = await this.client.getCurrentPrice(pairWithoutJpy as CoinType);
        // 現在の所持コイン量を取得
        const amount = await this.client.getCoinBalance(pairWithoutJpy as CoinType);
        // 再トレードを実行
        await this.client.createOrder({
          rate: currentPrice,
          amount: order.order_type === "sell" ? amount : Number(order.pending_amount),
          
          order_type: order.order_type,
          pair: order.pair
        });
        console.log(`再トレード実行: ${order.created_at}`);
      } catch (error) {
        console.error('再トレードの実行に失敗しました', error);
      }
    });
  }
}