export interface KabuOpenOrderDetail {
  SeqNum: number;
  ID: string;
  RecType: number;
  ExchangeID: string;
  State: number;
  TransactTime: string;
  OrdType: number;
  Price: number;
  Qty: number;
  ExecutionID: string;
  ExecutionDay: string;
  DelivDay: number;
  Commission: number;
  CommissionTax: number;
}

/**
 * カブステーションの未約定注文レスポンスを表すインターフェース
 *
 * @property ID 注文ID
 * @property State 注文の状態コード
 * @property OrderState 注文の詳細状態コード
 * @property OrdType 注文種別（例: 成行、指値）
 * @property RecvTime 注文受信日時（ISO8601形式）
 * @property Symbol 銘柄コード
 * @property SymbolName 銘柄名
 * @property Exchange 取引所コード
 * @property ExchangeName 取引所名
 * @property TimeInForce 有効期間条件
 * @property Price 注文価格
 * @property OrderQty 注文数量
 * @property CumQty 約定済数量
 * @property Side 売買区分（例: "1"=買, "2"=売）
 * @property CashMargin 現物・信用区分
 * @property AccountType 口座種別
 * @property DelivType 受渡区分
 * @property ExpireDay 注文有効期限（日付, yyyymmdd形式）
 * @property MarginTradeType 信用取引区分
 * @property MarginPremium プレミアム料（信用取引の場合、なければnull）
 * @property Details 注文詳細情報の配列
 */
export interface KabuOpenOrderResponse {
  ID: string;
  State: number;
  OrderState: number;
  OrdType: number;
  RecvTime: string;
  Symbol: string;
  SymbolName: string;
  Exchange: number;
  ExchangeName: string;
  TimeInForce: number;
  Price: number;
  OrderQty: number;
  CumQty: number;
  Side: string;
  CashMargin: number;
  AccountType: number;
  DelivType: number;
  ExpireDay: number;
  MarginTradeType: number;
  MarginPremium: number | null;
  Details: KabuOpenOrderDetail[];
}
