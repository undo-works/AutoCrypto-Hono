import * as crypto from 'crypto';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { EthPriceEntity } from './types/coincheck/CoinPriceResponse';
import { BalanceEntity } from './types/coincheck/BalanceEntity';
import { OpenOrdersEntity } from './types/coincheck/OpenOrdersEntity';
import { DeleteOpenOrderResponse } from './types/coincheck/DeleteOpenOrderResponse';
import { CoincheckCoinType } from './types/CoinTypes';
import { ExchangeOrderResponse } from './types/coincheck/ExchangeOrderResponse';

type OrderType = 'buy' | 'sell';
type OrderParams = {
  rate: number;
  amount: number;
  order_type: OrderType;
  pair: string;
};

export class CoinCheckClient {
  private readonly ENDPOINT = 'https://coincheck.com/api';

  // axiosインスタンスを事前設定
  private axiosInstance = axios.create({
    baseURL: this.ENDPOINT,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  constructor(
    private accessKey: string,
    private secretKey: string
  ) { }

  /**
   * 署名生成関数（非同期化）
   * @param nonce タイムスタンプ
   * @param path APIエンドポイントパス
   * @param body リクエストボディ
   * @returns 署名文字列
   */
  private async generateSignature(nonce: string, path: string, body: string): Promise<string> {
    const message = nonce + this.ENDPOINT + path + body;
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('hex');
  }

  /**
   * 統合リクエストメソッド
   * @param method HTTPメソッド
   * @param path APIエンドポイントパス
   * @param data リクエストボディ
   * @returns レスポンスデータ
   */
  async request<T>(method: Method, path: string, data?: any): Promise<T> {
    const nonce = Date.now().toString();

    // 署名生成
    const signature = await this.generateSignature(
      nonce,
      path,
      data ? JSON.stringify(data) : ''
    );

    // axios設定オブジェクト
    const config: AxiosRequestConfig = {
      method,
      url: path,
      headers: {
        'ACCESS-KEY': this.accessKey,
        'ACCESS-NONCE': nonce,
        'ACCESS-SIGNATURE': signature,
      },
      data // POST用ボディ
    };

    try {
      const response = await this.axiosInstance.request<T>(config);

      // ステータスコード200以外はエラー扱い
      if (response.status !== 200) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      // エラー詳細をログ出力
      if (axios.isAxiosError(error)) {
        console.error('API Error Details:', {
          status: error.response?.status,
          data: error.response?.data,
          config: error.config
        });
      }
      throw new Error(`API request failed: ${error}`);
    }
  }

  /**
   * コインの現在価格を取得
   * @param coinType コインの種類
   * @returns 
   */
  async getCurrentPrice(coinType: CoincheckCoinType): Promise<number> {
    const ticker = await this.request<EthPriceEntity>('GET', `/ticker?pair=${coinType}_jpy`);
    return ticker.last;
  }

  // 注文作成（取引所方式）
  async createOrder(params: OrderParams): Promise<ExchangeOrderResponse> {
    console.log(`注文作成: ${params.pair} ${params.order_type} ${params.amount} ${params.rate}`);
    return this.request<ExchangeOrderResponse>('POST', '/exchange/orders', params);
  }

  // 未約定注文一覧
  async getOpenOrders(): Promise<OpenOrdersEntity> {
    return this.request<OpenOrdersEntity>('GET', '/exchange/orders/opens');
  }

  /**
   * 円の残高取得
   * @returns 残高情報
   */
  async getYenBalance(): Promise<number> {
    const balance = await this.request<BalanceEntity>('GET', '/accounts/balance');
    // 日本円を返す
    return Number(balance.jpy)
  }

  /**
   * コインの残高取得
   * @returns 残高情報
   */
  async getCoinBalance(coinType: CoincheckCoinType): Promise<number> {
    const balance = await this.request<BalanceEntity>('GET', '/accounts/balance');
    // コインの量を返す
    return Number(balance[coinType]);
  }

  /**
   * 残高取得
   * @returns 残高情報
   * @deprecated 使用しないこと
   */
  async getSumBalances(): Promise<number> {
    const balance = await this.request<BalanceEntity>('GET', '/accounts/balance');
    // 日本円 + ETHの残高×評価額を計算
    return Number(balance.jpy) + (Number(balance.eth));
  }

  /**
   * 未成約の注文をキャンセル
   * @param id 注文ID
   * @returns 
   */
  async deleteOpenOrder(id: number): Promise<DeleteOpenOrderResponse> {
    return this.request<DeleteOpenOrderResponse>('DELETE', `/exchange/orders/${id}`);
  }
}