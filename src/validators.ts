import {
  taskEither,
  nonEmptyArray,
  either,
  readerTaskEither,
  array,
  option,
  boolean,
} from "fp-ts";
import { pipe, flow, constant, Predicate } from "fp-ts/function";
import { Either } from "fp-ts/Either";
import { Option } from "fp-ts/Option";
import { Validator } from "./Validator";

function validator<I, O, E>(
  validation: (i: I) => Either<E, O>
): Validator<I, O, E> {
  return flow(
    validation,
    taskEither.fromEither,
    taskEither.mapLeft(nonEmptyArray.of)
  );
}

function fromPredicate<I, E>(
  predicate: Predicate<I>,
  errorMessage: E
): Validator<I, I, E> {
  return validator(either.fromPredicate(predicate, constant(errorMessage)));
}

function foldPredicate<I, O, E>(
  predicate: Predicate<I>,
  onFalse: (i: I) => O,
  onTrue: Validator<I, O, E>
): Validator<I, O, E> {
  return (i) =>
    pipe(
      predicate(i),
      boolean.fold(
        () => pipe(onFalse(i), taskEither.right),
        () => onTrue(i)
      )
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
  return pipe(
    array.sequence(
      readerTaskEither.getReaderTaskValidation(nonEmptyArray.getSemigroup<E>())
    )(validators),
    readerTaskEither.map((results) => results[0])
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
  let a = validators[0];
  for (let i = 1; i < validators.length; i++) {
    a = flow(a, taskEither.chain(validators[i]));
  }
  return a;
}

const lengthRange = <E, S extends string>(
  minLength: number,
  maxLength: number,
  errorMessage: E
): Validator<string, S, E> =>
  validator(
    either.fromPredicate(
      (s): s is S => s.length >= minLength && s.length <= maxLength,
      constant(errorMessage)
    )
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
): Validator<S, S, E> =>
  validator(either.fromPredicate((s) => regex.test(s), constant(errorMessage)));

const notRegex = <S extends string, E>(
  regex: RegExp,
  errorMessage: E
): Validator<S, S, E> =>
  validator(
    either.fromPredicate((s) => !regex.test(s), constant(errorMessage))
  );

const checked = <E>(errorMessage: E): Validator<boolean, true, E> =>
  validator(either.fromPredicate((s): s is true => s, constant(errorMessage)));

const defined = <A, E>(errorMessage: E): Validator<Option<A>, A, E> =>
  validator(either.fromOption(constant(errorMessage)));

const definedNoExtract = <A, E>(
  errorMessage: E
): Validator<Option<A>, Option<A>, E> =>
  validator((o) =>
    pipe(
      o,
      option.isSome,
      boolean.fold(
        constant(either.left(errorMessage)),
        constant(either.right(o))
      )
    )
  );

const validateIfDefined = <I, O, E>(
  contentValidator: Validator<I, O, E>
): Validator<Option<I>, Option<O>, E> =>
  option.traverse(taskEither.taskEither)(contentValidator);

const emailRegex = /^[_A-Za-z0-9-+]+(\.[_A-Za-z0-9-]+)*@[A-Za-z0-9-]+(\.[A-Za-z0-9]+)*(\.[A-Za-z]{2,})$/;
const validEmail = <E, S extends string>(errorMessage: E): Validator<S, S, E> =>
  regex(emailRegex, errorMessage);

const minDate = <E>(min: Date, errorMessage: E): Validator<Date, Date, E> =>
  validator(either.fromPredicate((d) => d >= min, constant(errorMessage)));

export const validators = {
  lengthRange,
  minLength,
  maxLength,
  regex,
  notRegex,
  checked,
  defined,
  definedNoExtract,
  validEmail,
  inParallel,
  inSequence,
  validator,
  fromPredicate,
  foldPredicate,
  minDate,
  validateIfDefined,
};
