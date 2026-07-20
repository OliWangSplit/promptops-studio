export interface QueueTask<T> { id: string; run: () => Promise<T> }
export interface QueueTaskResult<T> { id: string; status: 'completed' | 'failed' | 'cancelled'; value?: T; error?: unknown }

export class ConcurrencyQueue {
  private cancelled = false
  constructor(readonly concurrency: number) { if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 10) throw new Error('Concurrency must be between 1 and 10') }
  cancelPending(): void { this.cancelled = true }
  async run<T>(tasks: QueueTask<T>[], onState?: (id: string, state: 'queued' | 'running' | 'completed') => void): Promise<QueueTaskResult<T>[]> {
    tasks.forEach(task => onState?.(task.id, 'queued'))
    const results = new Array<QueueTaskResult<T>>(tasks.length)
    let next = 0
    const worker = async () => {
      while (next < tasks.length) {
        const index = next++
        const task = tasks[index]
        if (this.cancelled) {
          results[index] = { id: task.id, status: 'cancelled' }
          onState?.(task.id, 'completed')
          continue
        }
        onState?.(task.id, 'running')
        try {
          results[index] = { id: task.id, status: 'completed', value: await task.run() }
        } catch (error) {
          results[index] = { id: task.id, status: 'failed', error }
        }
        onState?.(task.id, 'completed')
      }
    }
    await Promise.all(Array.from({ length: Math.min(this.concurrency, tasks.length) }, worker))
    return results
  }
}
