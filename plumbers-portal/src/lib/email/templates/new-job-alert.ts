// src/lib/email/templates/new-job-alert.ts
import { getURL } from "@/lib/utils";
import type { Job } from "@/lib/types/job";

export function newJobAlertEmail(job: Job) {
  const jobUrl = getURL(`/dashboard/tradesperson/job-board/${job.id}`);

  return {
    subject: `New Job Alert: ${job.title}`,
    html: `
    <p><strong>A new job matching your profile has been posted!</strong></p>
    <p>A new job that matches your skills and service area is now available for quoting.</p>
    <p><strong>Job Title:</strong> ${job.title}</p>
    <p><strong>Location:</strong> ${job.location.postcode}</p>
    <br>
    <p><a href="${jobUrl}" style="background-color: #007bff; color: #ffffff; padding: 10px 15px; text-decoration: none; border-radius: 5px;">View Job Details</a></p>
    <br>
    <p>This is an opportunity to win new business. Be sure to submit your quote soon!</p>
  `
  };
}
