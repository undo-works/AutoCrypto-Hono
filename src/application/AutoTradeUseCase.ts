import { BINANCE_COIN_TYPES, COIN_TYPES, KABUSTATION_COIN_TYPES, MARKETS } from "../constants";
import { CoincheckMaService } from "../domain/services/CoincheckMaService";
import { MarketsRepository } from "../repository/MarketsRepository";
import { CurrenciesRepository } from "../repository/CurrenciesRepository";
import { CoincheckRetryTradeService } from "../domain/services/CoincheckRetryTradeService";
import { BinanceMaService } from "../domain/services/BinanceMaService";
import { BinanceRetryTradeService } from "../domain/services/BinanceRetryTradeService";
import { KabuStationMaService } from "../domain/services/KabuStationMaService";

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
  // バイナンスの取引取り消しサービス
  private binanceRetryTradeService: BinanceRetryTradeService;
  // コインチェックの取引実行サービス
  private coincheckMaServiceArray: CoincheckMaService[] = [];
  // バイナンスの取引実行サービス
  private binanceMaServiceArray: BinanceMaService[] = [];
  // 株ステーションの取引実行サービス
  private kabuStationMaServiceArray: KabuStationMaService[] = [];

  constructor() {
    this.marketsRepository = new MarketsRepository();
    this.currencyRepository = new CurrenciesRepository();
    this.coincheckRetryTradeService = new CoincheckRetryTradeService();
    // this.binanceRetryTradeService = new BinanceRetryTradeService();

    COIN_TYPES.forEach((coinType) => {
      this.coincheckMaServiceArray.push(new CoincheckMaService(coinType));
    })

    BINANCE_COIN_TYPES.forEach((coinType) => {
      this.binanceMaServiceArray.push(new BinanceMaService(coinType));
    })

    KABUSTATION_COIN_TYPES.forEach((coinType) => {
      this.kabuStationMaServiceArray.push(new KabuStationMaService(coinType));
    });;
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

    // リトライ処理の実行
    await this.binanceRetryTradeService.execute(binanceMarketid);

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

    // 銘柄情報の取得
    const kabuCurrencies = await this.currencyRepository.selectAll();

    // コインチェックの取引実行サービスのインスタンスを作成
    const kabuMarketid = await this.marketsRepository.selectMarketIdByName(MARKETS.KABUSTATION);
    // サービスを順次実行
    for (const kabuMaService of this.kabuStationMaServiceArray) {
      try {
        await kabuMaService.execute(
          kabuMarketid,
          kabuCurrencies.find((currency) => currency.symbol == kabuMaService.coinName)!
        );
      } catch (error) {
        console.log(error);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}