import { useFormo, validators } from "../src";
import { expectType } from "tsd";
import { failure, success } from "../src/Result";
import { NonEmptyArray } from "../src/NonEmptyArray";

const { fieldProps, fieldErrors } = useFormo(
  {
    initialValues: {
      name: "",
      age: 23,
    },
    fieldValidators: () => ({
      name: validators.maxLength(10, false),
      age: validators.validator((i: number) =>
        i >= 18 ? success(i.toString()) : failure(false)
      ),
    }),
  },
  {
    onSubmit: (values) => {
      expectType<string>(values.name);
      expectType<string>(values.age);
      return Promise.resolve(failure(values));
    },
  }
);

expectType<string>(fieldProps("name").value);
expectType<(v: string) => unknown>(fieldProps("name").onChange);
expectType<NonEmptyArray<boolean> | undefined>(fieldProps("name").issues);

expectType<number>(fieldProps("age").value);
expectType<(v: number) => unknown>(fieldProps("age").onChange);
expectType<NonEmptyArray<boolean> | undefined>(fieldProps("age").issues);

expectType<Partial<Record<"name" | "age", NonEmptyArray<boolean>>>>(
  fieldErrors
);
