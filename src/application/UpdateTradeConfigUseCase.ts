import { VerifyMaIntervalService } from "../domain/services/VerifyMaIntervalService";
import { VerifyMaPercentService } from "../domain/services/VerifyMaPercentService";
import { MarketCurrenciesRepository } from "../repository/MarketCurrenciesRepository";

export class UpdateTradeConfigUseCase {
    // MAの期間を検証するサービス
    private verifyMaIntervalService: VerifyMaIntervalService;
    // MAのパーセントを検証するサービス
    private verifyMaPercentService: VerifyMaPercentService;
    // 市場銘柄のリポジトリ
    private marketCurrenciesRepository: MarketCurrenciesRepository;

    constructor() {
        this.verifyMaIntervalService = new VerifyMaIntervalService();
        this.verifyMaPercentService = new VerifyMaPercentService();
        this.marketCurrenciesRepository = new MarketCurrenciesRepository();
    }

    async execute(): Promise<void> {
        // MAのパーセントを検証
        await this.verifyMaPercentService.execute();
        
        // 市場銘柄のリポジトリから全ての市場銘柄を取得
        const allMarketCurrencies = await this.marketCurrenciesRepository.selectAll();

        // 各市場銘柄に対して最適なMAの期間を検証
        for (const marketCurrency of allMarketCurrencies) {

            // 最適なMAの期間を検証
            await this.verifyMaIntervalService.findOptimalPeriodsFromDb(marketCurrency);
        }
    }
}