import { BINANCE_COIN_TYPES } from "../../constants";
import { BinanceClient } from "../../infrastructure/api/BinanceClient";
import { errorLogger } from "../../infrastructure/logger/ErrorLogger";
import { updateConfigLogger } from "../../infrastructure/logger/UpdateConfigLogger";
import { CurrenciesRepository } from "../../repository/CurrenciesRepository";
import { MarketCurrenciesRepository } from "../../repository/MarketCurrenciesRepository";

export class VerifyMaPercentService {
  // 市場銘柄のリポジトリ
  private marketCurrenciesRepository: MarketCurrenciesRepository;
  // 銘柄のリポジトリ
  private currenciesRepository: CurrenciesRepository;
  // バイナンスのクライアント
  private binanceClient: BinanceClient;

  constructor() {
    this.marketCurrenciesRepository = new MarketCurrenciesRepository();
    this.currenciesRepository = new CurrenciesRepository();
    this.binanceClient = new BinanceClient(
      process.env.BINANCE_API_KEY!,
      process.env.BINANCE_SECRET_KEY!
    );
  }

  async execute(): Promise<void> {
    // 現在の市場銘柄の情報を取得
    const marketCurrencies = await this.marketCurrenciesRepository.selectAll();

    // 現在の銘柄の情報を取得
    const currencies = await this.currenciesRepository.selectAll();

    for (const symbol of BINANCE_COIN_TYPES) {
      try {
        const result = await this.binanceClient.getProfitLossLast72h(symbol);

        // BUYとSELLの合計数量・合計金額を計算
        let buyQty = 0;
        let buyTotal = 0;
        let sellQty = 0;
        let sellTotal = 0;
        for (const trade of result) {
          // console.log(`取引: ${trade.orderId}, 時間: ${new Date(trade.time).toLocaleString()}, 価格: ${trade.price}, 数量: ${trade.qty}, 売買: ${trade.isBuyer ? 'BUY' : 'SELL'}`);
          if (trade.isBuyer) {
            buyQty += Number(trade.qty);
            buyTotal += Number(trade.qty) * Number(trade.price) * 1.00075; // 購入時に0.075%手数料を加算
          } else {
            sellQty += Number(trade.qty);
            sellTotal += Number(trade.qty) * Number(trade.price) * 0.99925; // 売却時に 0.075%手数料を減算
          }
        }

        // 平均価格を計算
        const avgBuyPrice = buyTotal / buyQty;
        const avgSellPrice = sellTotal / sellQty;

        console.log(`銘柄: ${symbol} | 損益率 | ${avgSellPrice / avgBuyPrice} 購入平均価格: ${avgBuyPrice}, 売却平均価格: ${avgSellPrice}, 件数: ${result.length}`);
        if (!(avgSellPrice / avgBuyPrice)) {
          updateConfigLogger.error(`平均価格が計算できませんでした: ${symbol}`);
          console.error(`平均価格が計算できませんでした: ${symbol}`);
          continue;
        }

        const currency = currencies.find(c => c.symbol === symbol);
        const marketCurrency = marketCurrencies.find(m => m.currency_id === currency?.currency_id);
        if (!currency || !marketCurrency) {
          updateConfigLogger.error(`銘柄情報が見つかりません: ${symbol}`);
          console.error(`銘柄情報が見つかりません: ${symbol}`);
          continue;
        }
        // マーケット銘柄のパーセントを取得
        const newPercent = Number(marketCurrency.percent) + ((avgSellPrice / avgBuyPrice) - 1) * 10;
        updateConfigLogger.info(`銘柄: ${symbol} | 新しいパーセント: ${newPercent}`);
        console.log(`銘柄: ${symbol} | 新しいパーセント: ${newPercent}`);
        // マーケット銘柄のパーセントを更新
        await this.marketCurrenciesRepository.updatePercent(marketCurrency?.market_currency_id, newPercent);

      } catch (error: any) {
        if (error instanceof Error) {
          errorLogger.error(error.message);
        } else {
          errorLogger.error(String(error));
        }
        console.error(`取引結果取得に失敗しました`, error);
      }
    }
  }
}