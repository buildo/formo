import { Result } from "./Result";
import { NonEmptyArray } from "./NonEmptyArray";

export type Validator<I, O, E> = (
  input: I
) => Promise<Result<NonEmptyArray<E>, O>>;
