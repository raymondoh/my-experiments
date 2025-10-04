// src/app/dashboard/messages/[jobId]/page.tsx
import { ChatMessages } from "@/components/messages/chat-messages";
import { requireSession } from "@/lib/auth/require-session";
import { jobService } from "@/lib/services/job-service";
import { userService } from "@/lib/services/user-service"; // Import user service
import { notFound, redirect } from "next/navigation";

interface JobChatPageProps {
  params: Promise<{ jobId: string }>;
}

export default async function JobChatPage({ params }: JobChatPageProps) {
  const { jobId } = await params;
  const session = await requireSession();
  const job = await jobService.getJobById(jobId);

  if (!job) {
    notFound();
  }

  const isCustomer = session.user.id === job.customerId;
  const isTradesperson = session.user.id === job.tradespersonId;
  const isAdmin = session.user.role === "admin";

  if (!isCustomer && !isTradesperson && !isAdmin) {
    redirect("/dashboard");
  }

  // --- THIS IS THE FIX ---
  // Fetch both users to get their names for the chat header.
  const [customer, tradesperson] = await Promise.all([
    userService.getUserById(job.customerId),
    job.tradespersonId ? userService.getUserById(job.tradespersonId) : null
  ]);

  const otherUserName = isCustomer
    ? tradesperson?.businessName || tradesperson?.name || "Tradesperson"
    : customer?.name || "Customer";
  // --- END OF FIX ---

  return (
    <div className="h-full">
      {/* Pass the new data as props to the client component */}
      <ChatMessages jobId={jobId} jobTitle={job.title} jobStatus={job.status} otherUserName={otherUserName} />
    </div>
  );
}
