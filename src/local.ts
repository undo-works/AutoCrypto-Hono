import { serve } from '@hono/node-server'
import app from './app'

/**
 * ローカル環境でのサーバー起動
 * npm run dev で実行
 */
const port = 3000
console.log(`Server is running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port
})