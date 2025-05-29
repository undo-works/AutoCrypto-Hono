/**
 * Binanceアカウント情報のレスポンスを表すインターフェース
 */
export interface BinanceAccountResponse {
    /**
     * メイカー手数料（数値）
     */
    makerCommission: number;
    /**
     * テイカー手数料（数値）
     */
    takerCommission: number;
    /**
     * 買い手手数料（数値）
     */
    buyerCommission: number;
    /**
     * 売り手手数料（数値）
     */
    sellerCommission: number;
    /**
     * 各種手数料率
     */
    commissionRates: {
        /**
         * メイカー手数料率（文字列）
         */
        maker: string;
        /**
         * テイカー手数料率（文字列）
         */
        taker: string;
        /**
         * 買い手手数料率（文字列）
         */
        buyer: string;
        /**
         * 売り手手数料率（文字列）
         */
        seller: string;
    };
    /**
     * 取引可能かどうか
     */
    canTrade: boolean;
    /**
     * 出金可能かどうか
     */
    canWithdraw: boolean;
    /**
     * 入金可能かどうか
     */
    canDeposit: boolean;
    /**
     * ブローカー経由かどうか
     */
    brokered: boolean;
    /**
     * セルフトレード防止が必要かどうか
     */
    requireSelfTradePrevention: boolean;
    /**
     * SOR（スマートオーダールーティング）防止かどうか
     */
    preventSor: boolean;
    /**
     * 最終更新時刻（UNIXタイムスタンプ）
     */
    updateTime: number;
    /**
     * アカウントタイプ
     */
    accountType: string;
    /**
     * 資産残高の配列
     */
    balances: Array<{
        /**
         * 資産名（例: BTC, LTC）
         */
        asset: string;
        /**
         * 利用可能残高（文字列）
         */
        free: number;
        /**
         * ロック中残高（文字列）
         */
        locked: string;
    }>;
    /**
     * アカウントの権限一覧
     */
    permissions: string[];
    /**
     * ユーザーID
     */
    uid: number;
}