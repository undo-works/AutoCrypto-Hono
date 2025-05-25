import { BinanceCoinType, CoincheckCoinType } from "../infrastructure/api/types/CoinTypes";

/**
 * Represents a currency entity.
 * 通貨エンティティを表します。
 *
 * @property {number} currency_id - Unique identifier for the currency. 通貨のユニークなID。
 * @property {string} symbol - Currency symbol (e.g., BTC, ETH). 通貨のシンボル（例: BTC, ETH）。
 * @property {string | null} [name] - Optional name of the currency. 通貨の名前（省略可能）。
 * @property {string | null} [description] - Optional description of the currency. 通貨の説明（省略可能）。
 */
export interface CurrenciesEntity {
  currency_id: number;
  symbol: CoincheckCoinType | BinanceCoinType;
  name: string;
  description?: string | null;
}