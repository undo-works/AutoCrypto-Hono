import { COIN_TYPES } from "../../constants";
import { CurrenciesEntity } from "../../entity/CurrenciesEntity";
import { CoinCheckClient } from "../../infrastructure/api/CoinCheckClient";
import { BinanceCoinType, CoincheckCoinType } from "../../infrastructure/api/types/CoinTypes";
import { CurrenciesRepository } from "../../repository/CurrenciesRepository";
import { MarketPricesRepository } from "../../repository/MarketPricesRepository";
import * as dotenv from "dotenv";
import { TransactionsRepository } from "../../repository/TransactionsRepository";
import { MarketCurrenciesRepository } from "../../repository/MarketCurrenciesRepository";
dotenv.config();

/**
 * 移動平均線戦略の実装
 * 短期移動平均線が長期移動平均線を上抜けたら買い、下抜けたら売り
 */
export class MaService {

  // コインチェッククライアントのインスタンス
  protected client: CoinCheckClient;

  // 市場価格のリポジトリ
  protected marketPriceRepository: MarketPricesRepository;
  // 銘柄情報のリポジトリ
  protected transactionsRepository: TransactionsRepository;
  // 市場ごとの銘柄情報のリポジトリ
  protected marketCurrenciesRepository: MarketCurrenciesRepository;

  // コイン名
  public coinName: CoincheckCoinType | BinanceCoinType;

  // 移動平均期間の設定（短期25期間、長期125期間）
  // protected readonly SHORT_TERM = 25;
  // protected readonly LONG_TERM = 125;

  // リスク管理パラメータ
  /** 1トレードの許容リスク */
  // protected readonly RISK_PERCENT = 20;
  /** ストップロス幅 */
  private readonly STOP_LOSS_PCT = 5;
  private readonly TAKE_PROFIT_PCT = 15; // 利確幅

  constructor(coinName: CoincheckCoinType | BinanceCoinType) {
    this.coinName = coinName;
    this.client = new CoinCheckClient(
      process.env.COINCHECK_ACCESS_KEY!,
      process.env.COINCHECK_SECRET_ACCESS_KEY!
    );
    this.marketPriceRepository = new MarketPricesRepository();
    this.transactionsRepository = new TransactionsRepository();
    this.marketCurrenciesRepository = new MarketCurrenciesRepository();
  }

  // 移動平均計算メソッド
  protected calculateMA(period: number, prices: number[]): number {
    // 直近N期間の終値平均を計算
    // ASCの順番の時は-period、DESCの順番の時はperiod
    return prices.slice(0, period).reduce((sum, price) => sum + price, 0) / period;
  }
}