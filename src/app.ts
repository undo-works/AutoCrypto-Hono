import { Hono } from "hono";

/** Honoインスタンス */
const app = new Hono()

// ルーティング
app.get('/', async(c) => {})  // 確認用

export default app;