/**
 * RateLimitedExecutor — runs a queue of async tasks in fixed-size batches
 * with a pause between batches. Useful for throttling outbound work such
 * as bulk email, webhooks, or re-indexing jobs without external infra.
 *
 * This is intentionally generic; pass any async function as a task.
 */
type AsyncTask<T = unknown> = () => Promise<T>;

export class RateLimitedExecutor {
  private queue: AsyncTask[] = [];
  private running = false;

  constructor(
    private readonly batchSize = 5,
    private readonly intervalMs = 1000,
  ) {}

  addTask(task: AsyncTask): void {
    this.queue.push(task);
    void this.run();
  }

  addTasks(tasks: AsyncTask[]): void {
    this.queue.push(...tasks);
    void this.run();
  }

  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.batchSize);

      await Promise.all(
        batch.map(task =>
          task().catch(err => {
            console.error("[RateLimitedExecutor] task failed:", err);
          }),
        ),
      );

      if (this.queue.length > 0) {
        await this.sleep(this.intervalMs);
      }
    }

    this.running = false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}