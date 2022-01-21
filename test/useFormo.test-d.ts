import { subFormValue, useFormo, validators } from "../src";
import { expectType } from "tsd";
import { failure, success } from "../src/Result";
import { NonEmptyArray } from "../src/NonEmptyArray";

export function simple() {
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
}

export function definedValidator() {
  type Values = {
    notValidated?: string;
    name?: string;
    surname?: string | null;
    city: string | null;
    address: string | null | undefined;
  };
  const initialValues: Values = {
    city: null,
    address: undefined,
  };
  useFormo(
    {
      initialValues,
      // declaring _values here:
      fieldValidators: (_values) => ({
        name: validators.defined("required"),
        surname: validators.defined("required"),
        city: validators.defined("required"),
        address: validators.defined("required"),
      }),
    },
    {
      onSubmit: (values) => {
        expectType<string>(values.name);
        expectType<string>(values.surname);
        expectType<string>(values.city);
        expectType<string>(values.address);
        expectType<string | undefined>(values.notValidated);

        return Promise.resolve(failure(null));
      },
    }
  );
}

export function definedValidatorNoValuesParam() {
  type Values = {
    notValidated?: string;
    name?: string;
    surname?: string | null;
    city: string | null;
    address: string | null | undefined;
  };
  const initialValues: Values = {
    city: null,
    address: undefined,
  };
  useFormo(
    {
      initialValues,
      // not declaring the values argument here:
      fieldValidators: () => ({
        name: validators.defined("required"),
        surname: validators.defined("required"),
        city: validators.defined("required"),
        address: validators.defined("required"),
      }),
    },
    {
      onSubmit: (values) => {
        expectType<string | undefined>(values.notValidated);
        // all of the following end up being `unknown`, not sure how to fix this
        // @ts-expect-error
        expectType<string>(values.name);
        // @ts-expect-error
        expectType<string>(values.surname);
        // @ts-expect-error
        expectType<string>(values.city);
        // @ts-expect-error
        expectType<string>(values.address);

        return Promise.resolve(failure(null));
      },
    }
  );
}

export function validatorsInSequence() {
  type Values = {
    checked1?: string;
  };
  const initialValues: Values = {};
  useFormo(
    {
      initialValues,
      fieldValidators: (_values) => ({
        checked1: validators.inSequence(
          validators.defined("required"),
          validators.validator((i) => success(i === "true")),
          validators.checked("not checked")
        ),
      }),
    },
    {
      onSubmit: (values) => {
        expectType<true>(values.checked1);

        return Promise.resolve(failure(null));
      },
    }
  );
}

export function noValidators() {
  const { fieldProps, fieldErrors } = useFormo(
    {
      initialValues: {
        name: "",
        age: 23,
      },
      fieldValidators: () => ({}),
    },
    {
      onSubmit: (values) => {
        expectType<string>(values.name);
        expectType<number>(values.age);
        return Promise.resolve(failure(values));
      },
    }
  );

  expectType<string>(fieldProps("name").value);
  expectType<(v: string) => unknown>(fieldProps("name").onChange);
  expectType<NonEmptyArray<never> | undefined>(fieldProps("name").issues);

  expectType<number>(fieldProps("age").value);
  expectType<(v: number) => unknown>(fieldProps("age").onChange);
  expectType<NonEmptyArray<never> | undefined>(fieldProps("age").issues);

  expectType<Partial<Record<"name" | "age", NonEmptyArray<never>>>>(
    fieldErrors
  );
}

export function arrayAndFieldArray() {
  const { fieldProps, subForm } = useFormo(
    {
      initialValues: {
        array: [] as Array<string>,
        fieldArray: subFormValue([] as Array<{ name: string }>),
      },
      fieldValidators: () => ({}),
    },
    {
      onSubmit: (values) => Promise.resolve(failure(values)),
    }
  );

  expectType<Array<string>>(fieldProps("array").value);
  expectType<string>(subForm("fieldArray").items[0].fieldProps("name").value);
  // @ts-expect-error
  fieldArray("array");
  // @ts-expect-error
  fieldProps("fieldArray");
}
