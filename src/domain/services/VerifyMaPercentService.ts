import { MarketCurrenciesRepository } from "../../repository/MarketCurrenciesRepository";

export class VerifyMaPercentService {
  // 市場銘柄のリポジトリ
  private marketCurrenciesRepository: MarketCurrenciesRepository;

  constructor() {
    this.marketCurrenciesRepository = new MarketCurrenciesRepository();
  }

  async execute(): Promise<void> {
    // SQLでパーセントを一括更新。以上。
    await this.marketCurrenciesRepository.updataAllPercent();
  }
}