export const getDepositPaidEmailTemplate = (
  userType: "customer" | "tradesperson",
  jobTitle: string,
  depositAmount: number
) => {
  const formattedAmount = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP"
  }).format(depositAmount);

  if (userType === "customer") {
    return {
      subject: `Receipt for your deposit payment of ${formattedAmount}`,
      html: `
        <h1>Deposit Payment Confirmation</h1>
        <p>Hi,</p>
        <p>This email is to confirm your deposit payment of <strong>${formattedAmount}</strong> for the job: <strong>"${jobTitle}"</strong> has been successfully processed.</p>
        <p>The tradesperson has been notified and the job is now secured. You can view the job details and chat with the tradesperson in your dashboard.</p>
        <p>Thank you for using our platform.</p>
      `
    };
  } else {
    // For tradesperson
    return {
      subject: `A deposit of ${formattedAmount} has been paid for your job`,
      html: `
        <h1>Deposit Paid Notification</h1>
        <p>Hi,</p>
        <p>Great news! The customer has paid a deposit of <strong>${formattedAmount}</strong> for the job: <strong>"${jobTitle}"</strong>.</p>
        <p>This job is now officially secured. Please coordinate with the customer via the messaging feature in your dashboard to arrange a start date.</p>
        <p>The funds (minus the platform fee) will be available in your Stripe account according to your payout schedule.</p>
      `
    };
  }
};
