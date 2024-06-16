export interface UseCase<Input, Output> {
  process(command: Input): Output
}

export interface CommandUseCase<Output> {
  process(): Output
}

export interface AsyncUseCase<Input, Output> {
  process(command: Input): Promise<Output>
}

export interface AsyncCommandUseCase<Output> {
  process(): Promise<Output>
}
