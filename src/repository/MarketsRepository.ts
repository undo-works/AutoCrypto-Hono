import { MarketsEntity } from '../entity/MarketsEntity';
import { query } from './mysql';


/** 
 * マーケット情報を管理するリポジトリクラス
 */
export class MarketsRepository {
  /**
   * マーケット名からマーケットIDを取得する
   * @param marketName マーケット名
   * @returns マーケットID
   */
  async selectMarketIdByName(marketName: string): Promise<number> {
    // 指定したマーケット名でmarketsテーブルを検索
    const rows = await query<MarketsEntity[]>(`
        SELECT *
        FROM markets
        WHERE market_name = ?
      `, [marketName]
    );
    // 最初の結果のmarket_idを返す
    return rows[0].market_id;
  }
}