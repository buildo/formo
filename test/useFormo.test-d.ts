import { useFormo, validators } from "../src";
import { expectType } from "tsd";
import { either, taskEither } from "fp-ts";
import { NonEmptyArray } from "fp-ts/NonEmptyArray";
import { Option } from "fp-ts/Option";

const { fieldProps, fieldErrors } = useFormo(
  {
    initialValues: {
      name: "",
      age: 23,
    },
    fieldValidators: () => ({
      name: validators.maxLength(10, false),
      age: validators.validator((i: number) =>
        i >= 18 ? either.right(i.toString()) : either.left(false)
      ),
    }),
  },
  {
    onSubmit: (values) => {
      expectType<string>(values.name);
      expectType<string>(values.age);
      return taskEither.left(values);
    },
  }
);

expectType<string>(fieldProps("name").value);
expectType<(v: string) => unknown>(fieldProps("name").onChange);
expectType<Option<NonEmptyArray<boolean>>>(fieldProps("name").issues);

expectType<number>(fieldProps("age").value);
expectType<(v: number) => unknown>(fieldProps("age").onChange);
expectType<Option<NonEmptyArray<boolean>>>(fieldProps("age").issues);

expectType<Record<"name" | "age", Option<NonEmptyArray<boolean>>>>(fieldErrors);
