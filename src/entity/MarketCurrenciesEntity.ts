// marketcurrencies テーブルのエンティティを表すインターフェース
export interface MarketCurrenciesEntity {
    /** 自動採番される主キーID */
    market_currency_id: number;
    /** marketsテーブルの外部キー（市場ID） */
    market_id: number;
    /** currenciesテーブルの外部キー（通貨ID） */
    currency_id: number;
    /** クロスステータス（'golden' または 'dead'、NULLも可） */
    cross_status?: 'golden' | 'dead' | null;
    /** パーセンテージ（デフォルト: 20.00） */
    percent: string; // decimal(5,2)はstringで表現
    /** 短期値（デフォルト: 25） */
    short_term: number;
    /** 長期値（デフォルト: 125） */
    long_term: number;
}