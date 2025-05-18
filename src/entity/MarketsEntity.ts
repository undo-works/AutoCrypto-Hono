/**
 * MarketsEntity インターフェースは 'markets' テーブルの1行を表します。
 */
export interface MarketsEntity {
  /** マーケットのユニークな識別子（主キー） */
  market_id: number;
  /** マーケット名（ユニークである必要があります） */
  market_name: string;
  /** マーケットの説明（任意） */
  description?: string | null;
}