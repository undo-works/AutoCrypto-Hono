import { BINANCE_COIN_TYPES, COIN_TYPES, MARKETS } from "../constants";
import { CoincheckMaService } from "../domain/services/CoincheckMaService";
import { MarketsRepository } from "../repository/MarketsRepository";
import { CurrenciesRepository } from "../repository/CurrenciesRepository";
import { CoincheckRetryTradeService } from "../domain/services/CoincheckRetryTradeService";
import { BinanceMaService } from "../domain/services/BinanceMaService";

/**
 * 自動売買戦略を管理するユースケース
 */
export class AutoTradeUseCase {

  // マーケットのリポジトリ
  private marketsRepository: MarketsRepository;
  // 銘柄情報のリポジトリ
  private currencyRepository: CurrenciesRepository;

  // コインチェックの取引取り消しサービス
  private coincheckRetryTradeService: CoincheckRetryTradeService;
  // コインチェックの取引実行サービス
  private coincheckMaServiceArray: CoincheckMaService[] = [];
  // バイナンスの取引実行サービス
  private binanceMaServiceArray: BinanceMaService[] = [];

  constructor() {
    this.marketsRepository = new MarketsRepository();
    this.currencyRepository = new CurrenciesRepository();
    this.coincheckRetryTradeService = new CoincheckRetryTradeService();

    COIN_TYPES.forEach((coinType) => {
      this.coincheckMaServiceArray.push(new CoincheckMaService(coinType));
    })

    BINANCE_COIN_TYPES.forEach((coinType) => {
      this.binanceMaServiceArray.push(new BinanceMaService(coinType));
    })
  }

  /**
   * 戦略を実行するメソッド
   */
  async execute(): Promise<void> {

    // 銘柄情報の取得
    const currencies = await this.currencyRepository.selectAll();

    // コインチェックの取引実行サービスのインスタンスを作成
    const coincheckMarketid = await this.marketsRepository.selectMarketIdByName(MARKETS.COINCHECK);

    // コインチェックの取引取り消し&再実行サービスを実行
    await this.coincheckRetryTradeService.execute();

    // サービスを順次実行
    for (const coincheckMaService of this.coincheckMaServiceArray) {
      try {
        await coincheckMaService.execute(
          coincheckMarketid,
          currencies.find((currency) => currency.symbol == coincheckMaService.coinName)!
        );
      } catch (error) {
        console.log(error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }


    // バイナンスの取引実行サービスのインスタンスを作成
    // 銘柄情報の取得
    const binanceCurrencies = await this.currencyRepository.selectAll();

    // コインチェックの取引実行サービスのインスタンスを作成
    const binanceMarketid = await this.marketsRepository.selectMarketIdByName(MARKETS.BINANCE);

    // TODO: リトライ処理の実行

    // サービスを順次実行
    for (const binanceMaService of this.binanceMaServiceArray) {
      try {
        await binanceMaService.execute(
          binanceMarketid,
          binanceCurrencies.find((currency) => currency.symbol == binanceMaService.coinName)!
        );
      } catch (error) {
        console.log(error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}