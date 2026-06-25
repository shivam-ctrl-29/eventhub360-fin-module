import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JOB_NAMES, QUEUE_NAMES } from '../../../common/constants';

interface DunningJobData {
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  daysOverdue: number;
  amountDue: number;
  level: string;
  manual?: boolean;
}

/**
 * Processes dunning jobs enqueued by DunningService.
 * Channels per spec: L1 email, L2 email+sms+CRM, L3 demand-letter PDF,
 * L4 manual escalation to finance head. Delivery integrations are stubbed
 * here (logged) and should be wired to the email/SMS/CRM providers.
 */
@Processor(QUEUE_NAMES.DUNNING)
export class DunningProcessor {
  private readonly logger = new Logger(DunningProcessor.name);

  @Process(JOB_NAMES.SEND_DUNNING_L1)
  async handleL1(job: Job<DunningJobData>): Promise<{ sent: boolean }> {
    const { invoiceNumber, customerEmail, daysOverdue } = job.data;
    this.logger.log(
      `[L1] Email reminder for ${invoiceNumber} -> ${customerEmail} (${daysOverdue}d overdue)`,
    );
    // TODO: integrate transactional email provider
    return { sent: true };
  }

  @Process(JOB_NAMES.SEND_DUNNING_L2)
  async handleL2(job: Job<DunningJobData>): Promise<{ sent: boolean }> {
    const { invoiceNumber, customerEmail, customerName } = job.data;
    this.logger.log(
      `[L2] Email + SMS + CRM follow-up for ${invoiceNumber} -> ${customerName} <${customerEmail}>`,
    );
    // TODO: integrate email + SMS gateway + CRM task creation
    return { sent: true };
  }

  @Process(JOB_NAMES.SEND_DUNNING_L3)
  async handleL3(job: Job<DunningJobData>): Promise<{ sent: boolean }> {
    const { invoiceNumber, customerName, amountDue } = job.data;
    this.logger.warn(
      `[L3] Demand letter generated for ${invoiceNumber} -> ${customerName} (due Rs ${amountDue})`,
    );
    // TODO: generate demand-letter PDF and dispatch
    return { sent: true };
  }

  @Process(JOB_NAMES.ESCALATE_DUNNING_L4)
  async handleL4(job: Job<DunningJobData>): Promise<{ escalated: boolean }> {
    const { invoiceNumber, customerName, daysOverdue } = job.data;
    this.logger.error(
      `[L4] Manual escalation to finance head: ${invoiceNumber} (${customerName}, ${daysOverdue}d overdue)`,
    );
    // TODO: notify finance_head for manual legal/recovery action
    return { escalated: true };
  }
}
