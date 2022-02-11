export type Result<L, R> = Success<R> | Failure<L>;

export type Success<R> = {
  readonly type: "success";
  readonly success: R;
};

export type Failure<L> = {
  readonly type: "failure";
  readonly failure: L;
};

export function success<L = never, R = never>(success: R): Result<L, R> {
  return { type: "success", success };
}

export function failure<L = never, R = never>(failure: L): Result<L, R> {
  return { type: "failure", failure };
}

export function isSuccess<L, R>(result: Result<L, R>): result is Success<R> {
  return result.type === "success";
}

export function isFailure<L, R>(result: Result<L, R>): result is Failure<L> {
  return result.type === "failure";
}

export function matchResult<L, R, T>(
  result: Result<L, R>,
  matches: { success: (success: R) => T; failure: (failure: L) => T }
): T {
  switch (result.type) {
    case "success":
      return matches.success(result.success);
    case "failure":
      return matches.failure(result.failure);
  }
}

export function mapFailure<L, R, B>(
  result: Result<L, R>,
  mapFailure: (failure: L) => B
): Result<B, R> {
  switch (result.type) {
    case "success":
      return result;
    case "failure":
      return failure(mapFailure(result.failure));
  }
}
