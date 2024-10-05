export type PureAction<T> = {
  type: T
}

export type PayloadAction<T, PT> = {
  type: T
  payload: PT
}

export type InitPayloadAction<T> = DataActionWithPayload<'init', T>
