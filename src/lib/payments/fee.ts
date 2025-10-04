/** amount is in minor units (pence). returns application_fee_amount (also in pence). */
export function platformFee(amount: number) {
  const bps = Number(process.env.STRIPE_PLATFORM_FEE_BPS ?? 0);
  return Math.floor((amount * bps) / 10_000);
}
