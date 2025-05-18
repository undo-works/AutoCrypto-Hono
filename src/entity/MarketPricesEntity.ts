/**
 * marketprices テーブルのエンティティ
 */
export interface MarketPricesEntity {
  /** プライスID（主キー、自動採番） */
  price_id: bigint;
  /** マーケットID（marketsテーブルへの外部キー） */
  market_id: number;
  /** 通貨ID（currenciesテーブルへの外部キー） */
  currency_id: number;
  /** 記録日時（マイクロ秒精度） */
  record_datetime: Date;
  /** 価格（小数点以下10桁まで、最大30桁） */
  price: string;
}