import { MarketCurrenciesEntity } from "../../entity/MarketCurrenciesEntity";
import { MarketCurrenciesRepository } from "../../repository/MarketCurrenciesRepository";
import { MarketPricesRepository } from "../../repository/MarketPricesRepository";


/**
 * VerifyMaIntervalService クラスは、移動平均（MA）を用いた最適な売買期間（短期・長期）を探索し、
 * シミュレーションによって最大利益をもたらすパラメータを決定するサービスです。
 * 
 * ## 解説
 * - 価格履歴データをリポジトリから取得し、指定した短期・長期の移動平均を計算します。
 * - ゴールデンクロス（短期MAが長期MAを上抜け）で買い、デッドクロス（短期MAが長期MAを下抜け）で売るシンプルな売買シミュレーションを行います。
 * - さまざまな短期・長期の組み合わせでシミュレーションを繰り返し、最も利益が大きくなる組み合わせを探索します。
 * - 最適なパラメータが見つかった場合は、リポジトリを通じてDBに保存します。
 * 
 * @class VerifyMaIntervalService
 */
export class VerifyMaIntervalService {

    // 価格履歴のリポジトリ
    private marketPriceRepository: MarketPricesRepository;
    // 市場銘柄のリポジトリ
    private marketCurrenciesRepository: MarketCurrenciesRepository;

    constructor() {
        this.marketPriceRepository = new MarketPricesRepository();
        this.marketCurrenciesRepository = new MarketCurrenciesRepository();
    }

    /**
     * 指定されたデータ配列に対して移動平均を計算する
     * @param data 価格データ配列
     * @param window 移動平均の期間
     * @returns 移動平均配列（計算できない部分はNaN）
     */
    private calculateMovingAverage(data: number[], window: number): number[] {
        return data.map((_, index, arr) => {
            if (index < window - 1) return NaN; // ウィンドウサイズ未満は計算不可
            let sum = 0;
            for (let i = 0; i < window; i++) {
                sum += arr[index - i];
            }
            return sum / window;
        });
    }

    /**
     * 売買シミュレーションを実施し、最終的な資産残高を返す
     * @param data 価格データ配列
     * @param shortWindow 短期移動平均期間
     * @param longWindow 長期移動平均期間
     * @param initialBalance 初期資金
     * @returns シミュレーション後の資産残高
     */
    private simulateTrading(data: number[], shortWindow: number, longWindow: number, initialBalance: number = 1000000): number {
        // 移動平均を計算
        const shortMa = this.calculateMovingAverage(data, shortWindow);
        const longMa = this.calculateMovingAverage(data, longWindow);

        // シグナル配列（1:買い, -1:売り, 0:何もしない）を生成
        const signal: number[] = Array(data.length).fill(0);
        for (let i = shortWindow; i < data.length; i++) {
            // ゴールデンクロス（買いシグナル）
            if (shortMa[i] > longMa[i] && shortMa[i - 1] <= longMa[i - 1] && data[i] > data[i - 1] && data[i - 1] > data[i - 2]) {
                signal[i] = 1;
            // デッドクロス（売りシグナル）
            } else if (shortMa[i] < longMa[i] && shortMa[i - 1] >= longMa[i - 1]) {
                signal[i] = -1;
            }
        }

        let balance = initialBalance; // 現金残高
        let holdings = 0;             // 保有数量

        // シグナルに従って売買をシミュレート
        for (let i = 0; i < data.length; i++) {
            if (signal[i] === 1) {
                // 全額で購入
                const buyPrice = data[i];
                const amountToBuy = balance / buyPrice;
                holdings += amountToBuy;
                balance = 0;
            } else if (signal[i] === -1) {
                // 全量売却
                const sellPrice = data[i];
                balance += holdings * sellPrice;
                holdings = 0;
            }
        }

        // 最終残高（現金＋保有資産評価額）を返す
        const finalBalance = balance + holdings * data[data.length - 1];
        return finalBalance;
    }

    /**
     * DBから価格データを取得し、最適な短期・長期MA期間を探索してDBに保存する
     * @param marketId 市場ID
     * @param currencyId 通貨ID
     */
    async findOptimalPeriodsFromDb(marketCurrency: MarketCurrenciesEntity): Promise<void> {
        // 価格データを取得
        const priceData = await this.marketPriceRepository.fetchPriceData(marketCurrency.market_id, marketCurrency.currency_id);

        let bestProfit = -Infinity;
        let bestShortWindow: number | null = null;
        let bestLongWindow: number | null = null;

        // 探索する短期・長期ウィンドウの候補を生成
        const shortWindows = Array.from({ length: 40 }, (_, i) => (i + 1)); // 1,2,...,50
        const longWindows = Array.from({ length: 50 }, (_, i) => (i + 6) * 5);  // 5,10,...,250

        // 全組み合わせでシミュレーションし、最大利益となる組み合わせを探索
        for (const shortWindow of shortWindows) {
            for (const longWindow of longWindows) {
                if (shortWindow >= longWindow) continue; // 短期>=長期はスキップ
                const profit = this.simulateTrading(priceData, shortWindow, longWindow);
                if (profit > bestProfit) {
                    bestProfit = profit;
                    bestShortWindow = shortWindow;
                    bestLongWindow = longWindow;
                }
            }
        }
        // 最適な組み合わせが見つからなかった場合
        if (bestShortWindow === null || bestLongWindow === null) {
            console.log("最適な期間が見つかりませんでした。");
            return;
        }
        // 最適なパラメータをDBに保存
        await this.marketCurrenciesRepository.updateTerms(marketCurrency.market_id, marketCurrency.currency_id, bestShortWindow, bestLongWindow);
        console.log(`最大利益: ${bestProfit.toFixed(2)}`);
        console.log(`短期: ${bestShortWindow}分, 長期: ${bestLongWindow}分`);
    }
}
