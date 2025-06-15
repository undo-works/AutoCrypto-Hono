// BinanceClient.ts
import axios from 'axios';
import * as crypto from 'crypto';
import { BinanceOpenOrderResponse } from './types/binance/BinanceOpenOrderResponse';
import { BinanceAccountResponse } from './types/binance/BinanceAccountResponse';
import { Binance24hrTickerResponse } from './types/binance/Binance24hrTickerResponse';
import { BinanceMyTradeResponse } from './types/binance/BinanceMyTradeResponse';
import { BinanceOrderCreateResponse } from './types/binance/BinanceOrderCreateResponse';
import { autoTradeLogger } from '../logger/AutoTradeLogger';
import { BinanceCoinType } from './types/CoinTypes';



export class BinanceClient {

  private ENDPOINT = 'https://api.binance.com';

  constructor(
    private apiKey: string,
    private apiSecret: string
  ) { }

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
    const res = await this.axiosInstance.get<{ symbol: string, price: string }[]>(`/api/v3/ticker/price`);
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
    autoTradeLogger.info(`注文作成: ${symbol} ${side} ${quantity} ${price}`);
    const path = '/api/v3/order';

    // Binanceサーバー時刻を取得して補正
    const serverTimeRes = await this.axiosInstance.get<{ serverTime: number }>('/api/v3/time');
    const timestamp = serverTimeRes.data.serverTime;

    let params = `symbol=${symbol}&side=${side}&type=LIMIT&quantity=${quantity}&price=${price}&timeInForce=GTC&timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', this.apiSecret).update(params).digest('hex');

    const body = `${params}&signature=${signature}`;

    const res = await axios.post<BinanceOrderCreateResponse>(
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


  /** 特定銘柄の未約定注文一覧 */
  async getOpenOrder(symbol: string): Promise<BinanceOpenOrderResponse[]> {
    const path = '/api/v3/openOrders';
    // Binanceサーバー時刻を取得して補正
    const serverTimeRes = await this.axiosInstance.get<{ serverTime: number }>('/api/v3/time');
    const timestamp = serverTimeRes.data.serverTime;
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

  /** すべての未約定注文一覧 */
  async getAllOpenOrders(): Promise<BinanceOpenOrderResponse[]> {
    const path = '/api/v3/openOrders';
    // Binanceサーバー時刻を取得して補正
    const serverTimeRes = await this.axiosInstance.get<{ serverTime: number }>('/api/v3/time');
    const timestamp = serverTimeRes.data.serverTime;
    const params = `timestamp=${timestamp}`;
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

    // Binanceサーバー時刻を取得して補正
    const serverTimeRes = await this.axiosInstance.get<{ serverTime: number }>('/api/v3/time');
    const timestamp = serverTimeRes.data.serverTime;

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

    // Binanceサーバー時刻を取得して補正
    const serverTimeRes = await this.axiosInstance.get<{ serverTime: number }>('/api/v3/time');
    const timestamp = serverTimeRes.data.serverTime;

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

  /**
   * 現在所持している全資産の合計をBNBで換算して取得
   * @returns 資産の総額（BNB換算）
   */
  async getTotalBalanceInBNB(): Promise<number> {
    autoTradeLogger.info('口座情報を取得中...');
    // 口座情報取得
    const path = '/api/v3/account';
    const serverTimeRes = await this.axiosInstance.get<{ serverTime: number }>('/api/v3/time');
    const timestamp = serverTimeRes.data.serverTime;
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
    const balances = res.data.balances.filter(b => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0);

    // BNB価格取得用
    const getBNBValue = async (asset: string, amount: number): Promise<number> => {
      if (asset === 'BNB') return amount;
      // まずBNB建てペアがあるか確認
      const symbol = asset + 'BNB';
      try {
        const priceRes = await this.axiosInstance.get<{ symbol: string, price: string }>(`/api/v3/ticker/price?symbol=${symbol}`);
        const price = parseFloat(priceRes.data.price);
        return amount * price;
      } catch {
        // BNB建てがなければUSDT建てで換算し、BNB/USDTで割る
        if (asset === 'USDT') {
          // USDT→BNB
          const bnbUsdtRes = await this.axiosInstance.get<{ symbol: string, price: string }>(`/api/v3/ticker/price?symbol=BNBUSDT`);
          const bnbUsdtPrice = parseFloat(bnbUsdtRes.data.price);
          return amount / bnbUsdtPrice;
        }
        // それ以外は asset/USDT → USDT/BNB
        try {
          const assetUsdtRes = await this.axiosInstance.get<{ symbol: string, price: string }>(`/api/v3/ticker/price?symbol=${asset}USDT`);
          const assetUsdtPrice = parseFloat(assetUsdtRes.data.price);
          const bnbUsdtRes = await this.axiosInstance.get<{ symbol: string, price: string }>(`/api/v3/ticker/price?symbol=BNBUSDT`);
          const bnbUsdtPrice = parseFloat(bnbUsdtRes.data.price);
          return (amount * assetUsdtPrice) / bnbUsdtPrice;
        } catch {
          // 換算できない場合は0
          return 0;
        }
      }
    };

    let totalBNB = 0;
    for (const b of balances) {
      const amount = parseFloat(b.free) + parseFloat(b.locked);
      if (amount === 0) continue;
      totalBNB += await getBNBValue(b.asset, amount);
    }
    return totalBNB;
  }

  /**
   * 指定した注文をキャンセルする
   * @param symbol 
   * @param orderId 
   * @returns 
   */
  async cancelOrder(symbol: string, orderId: number) {
    const path = '/api/v3/order';
    const serverTimeRes = await this.axiosInstance.get<{ serverTime: number }>('/api/v3/time');
    const timestamp = serverTimeRes.data.serverTime;
    const params = `symbol=${symbol}&orderId=${orderId}&timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', this.apiSecret).update(params).digest('hex');

    const res = await this.axiosInstance.delete(
      `${path}?${params}&signature=${signature}`,
      {
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      }
    );
    return res.data;
  }

  /**
   * 指定した銘柄の直近72時間での取引による損益を取得
   * @param symbol 
   * @returns 損益（約定価格ベース, 手数料考慮なし, 買いはマイナス・売りはプラス）
   */
  async getProfitLossLast72h(symbol: BinanceCoinType): Promise<BinanceMyTradeResponse[]> {
    // 72時間前のタイムスタンプ(ms)
    const now = Date.now();
    const since = now - 72 * 60 * 60 * 1000;

    // 取引履歴を取得（最大1000件ずつ）
    let fromId: number | undefined = undefined;

    // パラメータ組み立て
    const path = '/api/v3/myTrades';
    const serverTimeRes = await this.axiosInstance.get<{ serverTime: number }>('/api/v3/time');
    const timestamp = serverTimeRes.data.serverTime;
    let params = `symbol=${symbol}&timestamp=${timestamp}&limit=1000&startTime=${timestamp - 24 * 3 * 60 * 60 * 1000}`;

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