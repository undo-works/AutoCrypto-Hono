import { handle } from 'hono/aws-lambda'
import app from './app'

/**
 * AWS Lambda 用のエントリーポイント
 */
export const handler = handle(app)
