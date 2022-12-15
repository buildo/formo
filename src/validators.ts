import { NonEmptyArray } from "./NonEmptyArray";
import { failure, mapFailure, matchResult, Result, success } from "./Result";
import { Validator } from "./Validator";

function validator<I, O, E>(
  validation: (i: I) => Result<E, O>
): Validator<I, O, E> {
  return (input) =>
    Promise.resolve(mapFailure(validation(input), (failure) => [failure]));
}

function fromPredicate<I, B extends I, E>(
  refinement: (input: I) => input is B,
  errorMessage: E
): Validator<I, B, E>;
function fromPredicate<I, E>(
  predicate: (input: I) => boolean,
  errorMessage: E
): Validator<I, I, E>;
function fromPredicate<I, E>(
  predicate: (input: I) => boolean,
  errorMessage: E
): Validator<I, I, E> {
  return validator((input) =>
    predicate(input) ? success(input) : failure(errorMessage)
  );
}

function inParallel<I, O, E>(
  v1: Validator<I, O, E>,
  v2: Validator<I, O, E>
): Validator<I, O, E>;
function inParallel<I, O, E>(
  v1: Validator<I, O, E>,
  v2: Validator<I, O, E>,
  v3: Validator<I, O, E>
): Validator<I, O, E>;
function inParallel<I, O, E>(
  v1: Validator<I, O, E>,
  v2: Validator<I, O, E>,
  v3: Validator<I, O, E>,
  v4: Validator<I, O, E>
): Validator<I, O, E>;
function inParallel<I, O, E>(
  ...validators: Validator<I, O, E>[]
): Validator<I, O, E> {
  return (input) =>
    Promise.all(validators.map((validator) => validator(input))).then(
      (results) => {
        const errors = results.flatMap((r) =>
          matchResult(r, {
            success: () => [] as E[],
            failure: (failure) => failure,
          })
        );

        return errors.length > 0
          ? failure(errors as NonEmptyArray<E>)
          : results[0];
      }
    );
}

function inSequence<I, O1, O2, E>(
  v1: Validator<I, O1, E>,
  v2: Validator<O1, O2, E>
): Validator<I, O2, E>;
function inSequence<I, O1, O2, O3, E>(
  v1: Validator<I, O1, E>,
  v2: Validator<O1, O2, E>,
  v3: Validator<O2, O3, E>
): Validator<I, O3, E>;
function inSequence<I, O1, O2, O3, O4, E>(
  v1: Validator<I, O1, E>,
  v2: Validator<O1, O2, E>,
  v3: Validator<O2, O3, E>,
  v4: Validator<O3, O4, E>
): Validator<I, O4, E>;
function inSequence<I, O1, O2, O3, O4, O5, E>(
  v1: Validator<I, O1, E>,
  v2: Validator<O1, O2, E>,
  v3: Validator<O2, O3, E>,
  v4: Validator<O3, O4, E>,
  v5: Validator<O4, O5, E>
): Validator<I, O5, E>;
function inSequence(
  ...validators: Validator<unknown, unknown, unknown>[]
): Validator<unknown, unknown, unknown> {
  return async (input) => {
    let value = input;
    for (const validator of validators) {
      const r = await validator(value);
      if (r.type === "failure") {
        return r;
      }
      value = r.success;
    }
    return success(value);
  };
}

const lengthRange = <E, S extends string>(
  minLength: number,
  maxLength: number,
  errorMessage: E
): Validator<string, S, E> =>
  fromPredicate(
    (s): s is S => s.length >= minLength && s.length <= maxLength,
    errorMessage
  );

const minLength = <E, S extends string>(
  length: number,
  errorMessage: E
): Validator<string, S, E> => lengthRange(length, Infinity, errorMessage);

const maxLength = <E, S extends string>(
  length: number,
  errorMessage: E
): Validator<string, S, E> => lengthRange(0, length, errorMessage);

const regex = <S extends string, E>(
  regex: RegExp,
  errorMessage: E
): Validator<S, S, E> => fromPredicate((s) => regex.test(s), errorMessage);

const notRegex = <S extends string, E>(
  regex: RegExp,
  errorMessage: E
): Validator<S, S, E> => fromPredicate((s) => !regex.test(s), errorMessage);

const checked = <E>(errorMessage: E): Validator<boolean, true, E> =>
  fromPredicate((s): s is true => s, errorMessage);

const defined = <A, E>(errorMessage: E): Validator<A, NonNullable<A>, E> =>
  fromPredicate((i): i is NonNullable<A> => i != null, errorMessage);

const validateIfDefined =
  <I, O, E>(
    contentValidator: Validator<I, O, E>
  ): Validator<I | undefined, O | undefined, E> =>
  (input) =>
    input != null
      ? contentValidator(input)
      : Promise.resolve(success(undefined));

const emailRegex =
  /^[_A-Za-z0-9-+]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;
const validEmail = <E, S extends string>(errorMessage: E): Validator<S, S, E> =>
  regex(emailRegex, errorMessage);

const minDate = <E>(min: Date, errorMessage: E): Validator<Date, Date, E> =>
  fromPredicate((d) => d >= min, errorMessage);

export const validators = {
  lengthRange,
  minLength,
  maxLength,
  regex,
  notRegex,
  checked,
  defined,
  validEmail,
  inParallel,
  inSequence,
  validator,
  fromPredicate,
  minDate,
  validateIfDefined,
};
