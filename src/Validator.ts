import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import { ReaderTaskEither } from "fp-ts/lib/ReaderTaskEither";

export type Validator<I, O, E> = ReaderTaskEither<I, NonEmptyArray<E>, O>;
