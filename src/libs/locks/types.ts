export interface Lock {
  readonly name: string
}

export interface LockContext<TaskResult> {
  (task: (lock: Lock | null) => Promise<TaskResult>): Promise<TaskResult>
}
