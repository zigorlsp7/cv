export type ApiSuccess<T> = {
  ok: true;
  requestId: string;
  data: T;
};

export type ApiError = {
  ok: false;
  requestId: string;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};
