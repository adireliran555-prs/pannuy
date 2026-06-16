// Payplus payments integration.
// Degrades gracefully like src/lib/sms.ts: if credentials are missing (or we're
// not configured), it logs and returns { ok: false } WITHOUT throwing, so callers
// can record the transaction as PENDING and continue.

export const MONTHLY_FEE_ILS = 1000;

// Flat platform commission a supplier owes us for each job completed through the
// platform. Placeholder until booking captures a job price (then make it a %).
export const PLATFORM_COMMISSION_ILS = 200;

// Payplus REST API base. When PAYPLUS_API_KEY is configured these functions would
// POST to the relevant endpoints under this base.
const PAYPLUS_API_BASE = "https://restapi.payplus.co.il/api/v1.0/";

export async function chargeDeposit({
  amountIls,
  meetingId,
  customerName,
}: {
  amountIls: number;
  meetingId: string;
  customerName: string;
}): Promise<{ ok: boolean; providerRef?: string }> {
  if (!process.env.PAYPLUS_API_KEY) {
    console.log(
      `[Payments] not configured, recording as PENDING (deposit ₪${amountIls} for meeting ${meetingId}, customer ${customerName})`
    );
    return { ok: false };
  }

  try {
    // TODO: POST to `${PAYPLUS_API_BASE}PaymentPages/generateLink` (or the
    // charge endpoint) with the Payplus API key + secret to charge the deposit.
    // Placeholder until wired: treat as not configured so we record PENDING.
    void PAYPLUS_API_BASE;
    console.log(
      `[Payments] PAYPLUS_API_KEY set but charge not yet wired — recording as PENDING (meeting ${meetingId})`
    );
    return { ok: false };
  } catch (err) {
    console.error("[Payments] chargeDeposit error:", err);
    return { ok: false };
  }
}

export async function createPayout({
  amountIls,
  supplierName,
}: {
  amountIls: number;
  supplierName: string;
}): Promise<{ ok: boolean; providerRef?: string }> {
  if (!process.env.PAYPLUS_API_KEY) {
    console.log(
      `[Payments] not configured, recording as PENDING (payout ₪${amountIls} to ${supplierName})`
    );
    return { ok: false };
  }

  try {
    // TODO: POST to `${PAYPLUS_API_BASE}...` payout/transfer endpoint with the
    // Payplus API key + secret to disburse funds to the supplier.
    // Placeholder until wired: treat as not configured so we record PENDING.
    void PAYPLUS_API_BASE;
    console.log(
      `[Payments] PAYPLUS_API_KEY set but payout not yet wired — recording as PENDING (${supplierName})`
    );
    return { ok: false };
  } catch (err) {
    console.error("[Payments] createPayout error:", err);
    return { ok: false };
  }
}
