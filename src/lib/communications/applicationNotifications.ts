import { prisma } from "@/lib/prisma";
import { dispatchCommunication } from "@/lib/communications/dispatcher";

export async function dispatchApplicationReceivedConfirmation(params: {
  applicationId: string;
  userId: string;
  jobId: string;
}) {
  const [candidateUser, job] = await Promise.all([
    prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, name: true, email: true, phoneNumber: true },
    }),
    prisma.jobListing.findUnique({
      where: { id: params.jobId },
      select: {
        id: true,
        title: true,
        company: { select: { name: true } },
      },
    }),
  ]);

  if (!candidateUser || !job) return;

  const variables = {
    candidate_name: candidateUser.name || "Candidate",
    company_name: job.company.name || "Employer",
    job_title: job.title,
  };

  if (candidateUser.email) {
    await dispatchCommunication({
      eventKey: "JOB_APPLICATION_RECEIVED",
      channel: "EMAIL",
      audience: "CANDIDATE",
      recipient: candidateUser.email,
      variables,
      idempotencyKey: `application:${params.applicationId}:candidate:email:received`,
      correlationId: params.applicationId,
      recipientRef: candidateUser.id,
    }).catch(() => null);
  }

  if (candidateUser.phoneNumber) {
    await dispatchCommunication({
      eventKey: "JOB_APPLICATION_RECEIVED",
      channel: "WHATSAPP",
      audience: "CANDIDATE",
      recipient: candidateUser.phoneNumber,
      variables,
      idempotencyKey: `application:${params.applicationId}:candidate:whatsapp:received`,
      correlationId: params.applicationId,
      recipientRef: candidateUser.id,
    }).catch(() => null);
  }
}
