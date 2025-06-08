import { ResultSetHeader } from "mysql2";
import { query } from "./mysql";


/**
 * 取引情報を表すインターフェース。
 */
export class TransactionsRepository {
  /**
   * 取引履歴の追加
   */
  async insertTransaction(
    marketId: number,
    currencyId: number,
    transactionType: string,
    quantity: number,
    pricePerUnit: number,
    totalAmount: number,
    offerId: number,
  ): Promise<void> {
    // A simple INSERT query
    try {
      const postInfo = await query<ResultSetHeader>(
        `INSERT INTO transactions (
          market_id,
          currency_id,
          transaction_type,
          quantity,
          price_per_unit,
          total_amount,
          offer_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?);`,
        [
          marketId,
          currencyId,
          transactionType,
          quantity,
          pricePerUnit,
          totalAmount,
          offerId
        ]
      );
      if (postInfo.affectedRows !== 1) {
        throw new Error("取引履歴の追加に失敗しました");
      }
    } catch (err) {
      console.log(err);
      throw new Error("取引履歴の追加に失敗しました");
    }
  }

  /**
   * アクティブフラグを更新
   */
  async updateActiveFlag(
    offerId: number,
    activeFlag: number
  ): Promise<void> { 
    // A simple UPDATE query
    try {
      const postInfo = await query<ResultSetHeader>(
        `UPDATE transactions
         SET active_flag = ?
         WHERE offer_id = ?;`,
        [activeFlag, offerId]
      );
      if (postInfo.affectedRows !== 1) {
        throw new Error("アクティブフラグの更新に失敗しました");
      }
    } catch (err) {
      console.log(err);
      throw new Error("アクティブフラグの更新に失敗しました");
    }
  }


  /**
   * 取引量を更新
   */
  async updateQuantity(
    offerId: number,
    quantity: number
  ): Promise<void> {
    try {
      const postInfo = await query<ResultSetHeader>(
        `UPDATE transactions
         SET quantity = ?
         WHERE offer_id = ?;`,
        [quantity, offerId]
      );
      if (postInfo.affectedRows !== 1) {
        throw new Error("取引量の更新に失敗しました");
      }
    } catch (err) {
      console.log(err);
      throw new Error("取引量の更新に失敗しました");
    }
  }
}