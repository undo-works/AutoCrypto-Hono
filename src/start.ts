import cron from 'node-cron';
import { AutoTradeUseCase } from './application/AutoTradeUseCase'
import { UpdateTradeConfigUseCase } from './application/UpdateTradeConfigUseCase';

const autoTradeUseCase = new AutoTradeUseCase();
const updateTradeConfigUseCase = new UpdateTradeConfigUseCase();

cron.schedule('*/1 * * * *', async () => {
  await autoTradeUseCase.execute();
}, {
  timezone: 'Asia/Tokyo'
});

cron.schedule('0 18 * * *', async () => {
  await updateTradeConfigUseCase.execute();
}, {
  timezone: 'Asia/Tokyo'
});