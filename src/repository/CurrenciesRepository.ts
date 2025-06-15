import { CurrenciesEntity } from "../entity/CurrenciesEntity";
import { errorLogger } from "../infrastructure/logger/ErrorLogger";
import { query } from "./mysql";

/**
 * 銘柄情報を取得するリポジトリ
 */
export class CurrenciesRepository {
  /**
   * 銘柄名から情報を取得する
   * @returns 銘柄全件
   */
  async selectAll(): Promise<CurrenciesEntity[]> {
    // A simple SELECT query
    try {
      const results = await query<CurrenciesEntity[]>(
        `SELECT * FROM currencies;`,
        []
      );
      return results;
    } catch (error) {
      if (error instanceof Error) {
        errorLogger.error(error.message);
      } else {
        errorLogger.error(String(error));
      }
      throw new Error("銘柄名から情報を取得することができませんでした");
    }
  }

  /**
   * 銘柄名から情報を取得する
   * @returns 銘柄一件
   */
  async selectByCurrencyId(currencyId: number): Promise<CurrenciesEntity> {
    // A simple SELECT query
    try {
      const results = await query<CurrenciesEntity[]>(
        `SELECT * FROM currencies WHERE currency_id = ?;`,
        [currencyId]
      );
      return results[0];
    } catch (error) {
      if (error instanceof Error) {
        errorLogger.error(error.message);
      } else {
        errorLogger.error(String(error));
      }
      throw new Error("銘柄名から情報を取得することができませんでした");
    }
  }

  /**
   * シンボルから情報を取得する
   * @param symbol 銘柄シンボル
   * @returns 銘柄一件
   */
  async selectBySymbol(symbol: string): Promise<CurrenciesEntity> {
    try {
      const results = await query<CurrenciesEntity[]>(
        `SELECT * FROM currencies WHERE symbol = ?;`,
        [symbol]
      );
      return results[0];
    } catch (error) {
      if (error instanceof Error) {
        errorLogger.error(error.message);
      } else {
        errorLogger.error(String(error));
      }
      throw new Error("シンボルから情報を取得することができませんでした");
    }
  }
}