import axios, { AxiosRequestConfig, Method } from 'axios';
import { KabuSendOrderResponse } from './types/kabustation/KabuSendOrderResponse';
import { KabuOpenOrderResponse } from './types/kabustation/KabuOpenOrderResponse';

// kabuステーションAPI用型定義
type AssetType = 'jp_stock';
type OrderSide = 'buy' | 'sell';
type OrderParams = {
  symbol: string; // 銘柄コード（例: '7203'）
  quantity: number;
  price: number;
  side: OrderSide;
};

type PriceResponse = { Symbol: string; CurrentPrice: number };
type BalanceResponse = { Cash: number; Stocks: Array<{ Symbol: string; Quantity: number }> };
type OrderResponse = { OrderId: string; Result: string };
type OpenOrdersResponse = { Orders: Array<{ OrderId: string; Symbol: string; State: string }> };
type CancelOrderResponse = { Result: string };

export class KabuStationClient {
  private readonly ENDPOINT = 'http://localhost:18080/kabusapi';

  private axiosInstance = axios.create({
    baseURL: this.ENDPOINT,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  private token: string | null = null;

  constructor(
    private password: string // kabuステーションAPIのパスワード
  ) { }

  /**
   * トークンを取得
   */
  async fetchToken(): Promise<string> {
    const res = await this.axiosInstance.post<{ Token: string }>('/token', {
      APIPassword: this.password
    });
    this.token = res.data.Token;
    return this.token;
  }

  /**
   * トークンを取得（キャッシュ利用）
   */
  private async getToken(): Promise<string> {
    if (!this.token) {
      return this.fetchToken();
    }
    return this.token;
  }

  async request<T>(method: Method, path: string, data?: any): Promise<T> {
    const token = await this.getToken();
    const config: AxiosRequestConfig = {
      method,
      url: path,
      headers: {
        'X-API-KEY': token,
      },
      data
    };

    try {
      const response = await this.axiosInstance.request<T>(config);
      if (response.status !== 200) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      return response.data;
    } catch (error) {
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
   * 銘柄の現在価格を取得
   */
  async getCurrentPrice(symbol: string): Promise<number> {
    // kabuステーションAPI: /board/{symbol}@1
    const price = await this.request<PriceResponse>('GET', `/board/${symbol}@1`);
    return price.CurrentPrice;
  }

  /**
   * 注文作成
   */
  async createOrder(params: OrderParams): Promise<KabuSendOrderResponse> {
    // kabuステーションAPI: /sendorder
    const orderRequest = {
      Password: '', // 必要に応じて設定
      Symbol: params.symbol,
      Exchange: 1, // 東証:1
      SecurityType: 1, // 現物:1
      Side: params.side === 'buy' ? '1' : '2',
      CashMargin: 1, // 現物:1
      DelivType: 0,
      FundType: 'AA',
      AccountType: 2,
      Qty: params.quantity,
      Price: params.price,
      ExpireDay: 0,
      FrontOrderType: 20 // 指値:20
    };
    return this.request<KabuSendOrderResponse>('POST', '/sendorder', orderRequest);
  }

  /**
   * 未約定注文一覧
   */
  async getOpenOrders(): Promise<KabuOpenOrderResponse[]> {
    // kabuステーションAPI: /orders
    const res = await this.request<KabuOpenOrderResponse[]>('GET', '/orders');
    return res;
  }

  /**
   * 円の残高取得
   */
  async getYenBalance(): Promise<number> {
    // kabuステーションAPI: /wallet/cash/1
    const res = await this.request<{ StockAccountWallet: number }>('GET', '/wallet/cash');
    return Number(res.StockAccountWallet);
  }

  /**
   * 資産の残高取得
   */
  async getAssetBalance(symbol: string): Promise<number> {
    // kabuステーションAPI: /positions
    const res = await this.request<{ Positions: Array<{ Symbol: string; Quantity: number }> }>('GET', '/positions');
    const stock = res.Positions.find(p => p.Symbol === symbol);
    return stock ? stock.Quantity : 0;
  }

  /**
   * 未成約の注文をキャンセル
   */
  async cancelOrder(orderId: string): Promise<CancelOrderResponse> {
    // kabuステーションAPI: /cancelorder
    const req = { OrderId: orderId, Password: '' }; // Password必要なら設定
    return this.request<CancelOrderResponse>('PUT', '/cancelorder', req);
  }
}
