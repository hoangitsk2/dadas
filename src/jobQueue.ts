import { APIManager } from "./apiManager";
import { assignModelForJob, fallbackModelForJob } from "./modelAssignment";
import { JobRecord, JobStatus, JobType } from "./types";

export class JobQueue {
  private jobs: Map<string, JobRecord> = new Map();
  private apiManager: APIManager;

  constructor(apiManager: APIManager) {
    this.apiManager = apiManager;
  }

  addJob(job: Omit<JobRecord, "status" | "model" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const model = assignModelForJob(job.type);
    const record: JobRecord = {
      ...job,
      status: JobStatus.PENDING,
      model,
      createdAt: now,
      updatedAt: now,
    };
    this.jobs.set(record.id, record);
    return record;
  }

  listJobs(): JobRecord[] {
    return [...this.jobs.values()].sort((a, b) => a.priority - b.priority);
  }

  getJob(id: string) {
    return this.jobs.get(id);
  }

  markCompleted(id: string, result: unknown) {
    const job = this.jobs.get(id);
    if (!job) {
      return;
    }
    job.status = JobStatus.COMPLETED;
    job.result = result;
    job.updatedAt = new Date();
  }

  markFailed(id: string, error: string) {
    const job = this.jobs.get(id);
    if (!job) {
      return;
    }
    job.status = JobStatus.FAILED;
    job.error = error;
    job.updatedAt = new Date();
  }

  requestExecutionSlot(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return null;
    }

    const key = this.apiManager.getNextAvailableKey(job.model);
    if (!key) {
      job.status = JobStatus.RETRYING;
      job.model = fallbackModelForJob(job.type);
      job.updatedAt = new Date();
      return null;
    }

    job.status = JobStatus.RUNNING;
    job.apiKeyId = key.id;
    job.updatedAt = new Date();
    return { job, key };
  }

  canRun(job: JobRecord): boolean {
    if (job.dependencies && job.dependencies.length > 0) {
      return job.dependencies.every((dep) => {
        const depJob = this.jobs.get(dep);
        return depJob?.status === JobStatus.COMPLETED;
      });
    }

    return true;
  }

  retryJob(jobId: string) {
    const job = this.jobs.get(jobId);
    if (!job) {
      return;
    }

    job.retries += 1;
    job.status = JobStatus.RETRYING;
    job.model = fallbackModelForJob(job.type);
    job.updatedAt = new Date();
  }

  scheduleNextBatch(limit: number) {
    const readyJobs = this.listJobs().filter(
      (job) => job.status === JobStatus.PENDING && this.canRun(job),
    );

    return readyJobs.slice(0, limit).map((job) => job.id);
  }
}

export const createDayJobs = (
  dayId: string,
  blockIds: string[],
  startPriority: number,
) => {
  const blockJobs: Omit<
    JobRecord,
    "status" | "model" | "createdAt" | "updatedAt"
  >[] = blockIds.map((blockId, index) => ({
    id: `block-${dayId}-${blockId}`,
    type: JobType.CHAT_BLOCK_ANALYSIS,
    data: { blockId, dayId },
    priority: startPriority + index,
    retries: 0,
  }));

  const dayJob: Omit<
    JobRecord,
    "status" | "model" | "createdAt" | "updatedAt"
  > = {
    id: `day-${dayId}`,
    type: JobType.DAY_AGGREGATION,
    data: { dayId, blocks: blockIds },
    priority: startPriority + blockIds.length + 1,
    retries: 0,
    dependencies: blockJobs.map((job) => job.id),
  };

  return { blockJobs, dayJob };
};
