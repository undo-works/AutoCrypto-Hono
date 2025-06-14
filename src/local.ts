import { serve } from '@hono/node-server'
import app from './app'
import { systemLogger } from './infrastructure/logger/SystemLogger'

/**
 * ローカル環境でのサーバー起動
 * npm run dev で実行
 */
const port = 3000
systemLogger.info(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})