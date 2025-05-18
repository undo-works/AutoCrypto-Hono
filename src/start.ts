import cron from 'node-cron';
import { AutoTradeUseCase } from './application/coincheck/AutoTradeUseCase'

const autoTradeUseCase = new AutoTradeUseCase();

cron.schedule('*/1 * * * *', async () => {
  await autoTradeUseCase.execute();
}, {
  timezone: 'Asia/Tokyo'
});