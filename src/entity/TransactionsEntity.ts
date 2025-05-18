/**
 * 取引情報を表すインターフェース
 */
export interface TransactionsEntity {
  /** 取引ID（主キー） */
  transaction_id: bigint;
  /** マーケットID（外部キー） */
  market_id: number;
  /** 通貨ID（外部キー） */
  currency_id: number;
  /** 取引タイプ（'BUY' または 'SELL'） */
  transaction_type: 'buy' | 'sell';
  /** 取引日時（マイクロ秒精度） */
  transaction_datetime?: Date;
  /** 取引数量 */
  quantity: string;
  /** 単価 */
  price_per_unit: string;
  /** 合計金額 */
  total_amount: string;
  /** 手数料 */
  fee?: string;
  /** 手数料通貨ID（外部キー） */
  fee_currency_id?: number | null;
  /** 有効フラグ（1:有効, 0:無効） */
  active_flag: boolean;
  /** オファーID */
  offer_id?: string | null;
  /** 備考 */
  notes?: string | null;
}