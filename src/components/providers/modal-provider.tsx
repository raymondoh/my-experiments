"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const PaymentSuccessModal = dynamic(() => import("@/components/subscriptions/payment-success-modal"), { ssr: false });
const SubscriptionCancelledModal = dynamic(() => import("@/components/subscriptions/subscription-cancelled-modal"), { ssr: false });
const JobPostedModal = dynamic(() => import("@/components/jobs/job-posted-modal"), { ssr: false });
const QuoteAcceptedModal = dynamic(() => import("@/components/jobs/quote-accepted-modal"), { ssr: false });
const QuoteSentModal = dynamic(() => import("@/components/jobs/quote-sent-modal"), { ssr: false });
const ProfileSavedModal = dynamic(() => import("@/components/profile/profile-saved-modal"), { ssr: false });
const UserDeletedModal = dynamic(() => import("@/components/admin/user-delete-modal"), { ssr: false });
const ReviewSubmittedModal = dynamic(() => import("@/components/reviews/review-submitted-modal"), { ssr: false });
const CertificationStatusUpdatedModal = dynamic(() => import("@/components/admin/certification-status-updated-modal"), { ssr: false });
const UserRoleUpdatedModal = dynamic(() => import("@/components/admin/user-role-update-modal"), { ssr: false });
const UserStatusUpdatedModal = dynamic(() => import("@/components/admin/user-status-update-modal"), { ssr: false });
const DepositPaidModal = dynamic(() => import("@/components/payments/deposit-paid-modal"), { ssr: false });
const StripeOnboardingCompleteModal = dynamic(
  () => import("@/components/payments/stripe-onboarding-complete-modal"),
  { ssr: false }
);

export default function ModalProvider() {
  const searchParams = useSearchParams();

  return (
    <>
      {searchParams.get("payment_success") && <PaymentSuccessModal />}
      {searchParams.get("subscription_cancelled") && <SubscriptionCancelledModal />}
      {searchParams.get("job_posted") && <JobPostedModal />}
      {searchParams.get("quote_accepted") && <QuoteAcceptedModal />}
      {searchParams.get("quote_sent") && <QuoteSentModal />}
      {searchParams.get("profile_saved") && <ProfileSavedModal />}
      {searchParams.get("user_deleted") && <UserDeletedModal />}
      {searchParams.get("review_submitted") && <ReviewSubmittedModal />}
      {searchParams.get("certification_status_updated") && <CertificationStatusUpdatedModal />}
      {searchParams.get("user_role_updated") && <UserRoleUpdatedModal />}
      {searchParams.get("user_status_updated") && <UserStatusUpdatedModal />}
      {searchParams.get("deposit_paid") && <DepositPaidModal />}
      {searchParams.get("connect") === "done" && <StripeOnboardingCompleteModal />}
    </>
  );
}

