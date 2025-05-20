import { Hono } from "hono";

import { AutoTradeUseCase } from './application/AutoTradeUseCase'

/** Honoインスタンス */
const app = new Hono()


const autoTradeUseCase = new AutoTradeUseCase();

// ルーティング
app.get('/', async (c) => { autoTradeUseCase.execute(); })  // 確認用

export default app;