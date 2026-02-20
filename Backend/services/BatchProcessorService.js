/**
 * Internal batch processor using async/await.
 * Processes items in configurable batch sizes with delays between batches.
 * No Redis or external queue required.
 */
class BatchProcessorService {
  constructor() {
    this.jobs = new Map(); // jobId -> { status, total, processed, failed, errors, results }
  }

  /**
   * Process items in batches with controlled concurrency
   * @param {string} jobId - Unique job identifier
   * @param {Array} items - Items to process
   * @param {Function} processFn - Async function to process each item
   * @param {Object} options - { batchSize: 10, delayMs: 500 }
   */
  async processBatch(jobId, items, processFn, options = {}) {
    const { batchSize = 10, delayMs = 500 } = options;

    this.jobs.set(jobId, {
      status: "processing",
      total: items.length,
      processed: 0,
      failed: 0,
      errors: [],
      results: [],
      startedAt: new Date(),
    });

    const job = this.jobs.get(jobId);

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map((item, idx) => processFn(item, i + idx))
      );

      for (const result of batchResults) {
        if (result.status === "fulfilled") {
          job.processed++;
          job.results.push(result.value);
        } else {
          job.failed++;
          job.errors.push(result.reason?.message || "Unknown error");
        }
      }

      // Delay between batches to prevent server overload
      if (i + batchSize < items.length) {
        await this._delay(delayMs);
      }
    }

    job.status = job.failed > 0 ? "completed_with_errors" : "completed";
    job.completedAt = new Date();

    return job;
  }

  getJobStatus(jobId) {
    return this.jobs.get(jobId) || null;
  }

  clearJob(jobId) {
    this.jobs.delete(jobId);
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default new BatchProcessorService();
