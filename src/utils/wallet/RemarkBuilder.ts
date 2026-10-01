/**
 * RemarkBuilder — produces human-readable remark strings for wallet /
 * transaction-style records. Domain-agnostic: pass the relevant fields and
 * receive a presentable summary suitable for an audit log or statement.
 */
type RemarkParams = {
  amount?: number;
  gateway?: string;
  gatewayTransId?: string;
  voucher_no?: string;
  toUser?: string;
  fromUser?: string;
  reason?: string;
  feeType?: string;
  adminId?: string;
  originalTxnId?: string;
};

export class RemarkBuilder {
  static deposit({ amount, gateway, gatewayTransId }: RemarkParams): string {
    return `Deposit of $${amount?.toFixed(2)} via ${gateway} (Gateway Txn: ${gatewayTransId})`;
  }

  static ticket_issue({ amount }: RemarkParams): string {
    return `Ticket issued for $${amount?.toFixed(2)}`;
  }

  static ticket_reissue({ amount }: RemarkParams): string {
    return `Ticket reissued for $${amount?.toFixed(2)}`;
  }

  static refund_in({ originalTxnId, reason }: RemarkParams): string {
    return `Refund for transaction ${originalTxnId}${reason ? `: ${reason}` : ""}`;
  }

  static void({ originalTxnId, reason }: RemarkParams): string {
    return `Void of transaction ${originalTxnId}${reason ? `: ${reason}` : ""}`;
  }

  static withdrawal({ amount, voucher_no }: RemarkParams): string {
    return `Withdrawal of $${amount?.toFixed(2)} to ${voucher_no}`;
  }

  static transfer_in({ amount, fromUser }: RemarkParams): string {
    return `Received $${amount?.toFixed(2)} from user ${fromUser}`;
  }

  static transfer_out({ amount, toUser }: RemarkParams): string {
    return `Transferred $${amount?.toFixed(2)} to user ${toUser}`;
  }

  static adjustment_credit({ amount, adminId, reason }: RemarkParams): string {
    return `Manual credit of $${amount?.toFixed(2)} by admin ${adminId}${reason ? `: ${reason}` : ""}`;
  }

  static adjustment_debit({ amount, adminId, reason }: RemarkParams): string {
    return `Manual debit of $${amount?.toFixed(2)} by admin ${adminId}${reason ? `: ${reason}` : ""}`;
  }

  static fee({ amount, feeType }: RemarkParams): string {
    return `${feeType} fee of $${amount?.toFixed(2)} charged`;
  }

  static reward({ amount, reason }: RemarkParams): string {
    return `Reward of $${amount?.toFixed(2)} credited${reason ? `: ${reason}` : ""}`;
  }
}