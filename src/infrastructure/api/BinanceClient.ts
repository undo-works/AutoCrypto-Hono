// BinanceClient.ts
import axios from 'axios';
import * as crypto from 'crypto';
import { BinanceOpenOrderResponse } from './types/binance/BinanceOpenOrderResponse';
import { BinanceAccountResponse } from './types/binance/BinanceAccountResponse';
import { Binance24hrTickerResponse } from './types/binance/Binance24hrTickerResponse';
import { BinanceMyTradeResponse } from './types/binance/BinanceMyTradeResponse';



export class BinanceClient {

  private ENDPOINT = 'https://api.binance.com';

  constructor(
    private apiKey: string,
    private apiSecret: string
  ) {}

    // axiosインスタンスを事前設定
  private axiosInstance = axios.create({
    baseURL: this.ENDPOINT,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  /**
   * 現在価格の取得
   * @param symbol 
   * @returns 
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    const res = await this.axiosInstance.get<{symbol: string, price: string}[]>(`/api/v3/ticker/price`);
    const ticker = res.data.find(t => t.symbol === symbol);
    if (!ticker) {
      throw new Error(`現在価格の取得に失敗しました: ${symbol}`);
    }
    return parseFloat(ticker.price);
  }

  /**
   * 取引を注文する
   * @param symbol 
   * @param side 
   * @param quantity 
   * @param type 
   * @param price 任意: 指値注文時の価格
   * @returns 
   */
  async createOrder(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number
  ) {
    console.log(`注文作成: ${symbol} ${side} ${quantity} ${price}`);
    const path = '/api/v3/order';
    const timestamp = Date.now();

    let params = `symbol=${symbol}&side=${side}&type=LIMIT&quantity=${quantity}&price=${price}&timeInForce=GTC&timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', this.apiSecret).update(params).digest('hex');

    const body = `${params}&signature=${signature}`;

    const res = await axios.post(
      `${this.ENDPOINT}${path}`,
      body,
      {
        headers: {
          'X-MBX-APIKEY': this.apiKey,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return res.data;
  }


  /** 未約定注文一覧 */
  async getOpenOrders(symbol: string): Promise<BinanceOpenOrderResponse[]> {
    const path = '/api/v3/openOrders';
    const timestamp = Date.now();
    const params = `timestamp=${timestamp}&symbol=${symbol}`;
    const signature = crypto.createHmac('sha256', this.apiSecret).update(params).digest('hex');

    const res = await this.axiosInstance.get(
      `${path}?${params}&signature=${signature}`,
      {
      headers: {
        'X-MBX-APIKEY': this.apiKey
      }
      }
    );
    return res.data;
  }

  /** コインの残高取得 */
  async getCoinBalance(coinName: string): Promise<number> {
    const path = '/api/v3/account';
    const timestamp = Date.now();
    const params = `timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', this.apiSecret).update(params).digest('hex');

    const res = await this.axiosInstance.get<BinanceAccountResponse>(
      `${path}?${params}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      }
    );
    
    const balance = res.data.balances.find(b => b.asset === coinName);
    if (!balance) {
      throw new Error(`${coinName}の残高が見つかりません`);
    }
    return parseFloat(balance.free);
  }

  /**
   * 指定した銘柄の24時間変動率(%)を取得
   * @param symbol 
   * @returns 
   */
  async get24hPriceChangePercent(symbol: string): Promise<Binance24hrTickerResponse> {
    const res = await this.axiosInstance.get<Binance24hrTickerResponse>(`/api/v3/ticker/24hr?symbol=${symbol}`);
    return res.data;
  }

  /**
   * 指定した銘柄の直近の取引履歴を取得
   * @param symbol 
   * @param limit 取得件数（デフォルト: 1）
   * @returns 
   */
  async getRecentTrades(symbol: string, limit: number = 1): Promise<BinanceMyTradeResponse[]> {
    const path = '/api/v3/myTrades';
    const timestamp = Date.now();
    const params = `symbol=${symbol}&limit=${limit}&timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', this.apiSecret).update(params).digest('hex');

    const res = await this.axiosInstance.get<BinanceMyTradeResponse[]>(
      `${path}?${params}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      }
    );
    return res.data;
  }
}