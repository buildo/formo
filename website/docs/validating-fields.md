---
id: validating-fields
title: Validating fields
---

`formo` supports field validations via `Validator`s.

```ts twoslash
import { NonEmptyArray, Result } from "@buildo/formo";
// ---cut---
export type Validator<I, O, E> = (
  input: I
) => Promise<Result<NonEmptyArray<E>, O>>;
```

A `Validator` is a function that takes the field's value as input `I` and returns a `Result` of
either errors `NonEmptyArray<E>` or a valid output `O`.

Note that `Validator`s may [trasform the field's value](#transforming-values) other than just validating it.

## Simple Validation

`formo` provides a number of `Validator`s for common use cases via a `validators` utility.
For example, to make sure a text field is at least 2 characters long:

```twoslash include simplevalidation
import { useFormo, validators, success } from "@buildo/formo";

const { fieldProps } = useFormo(
  {
    initialValues: {
      name: "",
    },
    fieldValidators: () => ({
      name: validators.minLength(2, "Name is too short"),
    }),
  },
  {
    onSubmit: async (values) => success(values),
  }
);
```

```ts twoslash
// @include: simplevalidation
```

Possible validation errors can be accessed via the `issues` field:

```ts twoslash
// @include: simplevalidation
// ---cut---
fieldProps("name").issues;
```

:::tip

The type of `issues` depends on the validator error type `E`.

For instance, if we were to use a validator as follows:

```ts twoslash
// @include: simplevalidation
// ---cut---
validators.minLength(2, { message: "Name is too short", severity: 1 });
```

then the type of `issues` would be

`NonEmptyArray<{ message: string, severity: number }> | undefined`

:::

## Multiple validations on a field

Some fields may require multiple validations. We can combine validations using the `inSequence`
and `inParallel` combinators.

As the name suggests, `inSequence` runs validations one after the other and the field's `issues`
will contain the **first** validation that failed:

```ts twoslash
// @include: simplevalidation
// ---cut---
validators.inSequence(
  validators.minLength(2, "Too short"),
  validators.regex(/^[A-Z]/, "Must start with an uppercase letter")
);
```

Alternatively, we can run the same validations in parallel:

```ts twoslash
// @include: simplevalidation
// ---cut---
validators.inParallel(
  validators.minLength(2, "Too short"),
  validators.regex(/^[A-Z]/, "Must start with an uppercase letter")
);
```

In this case, the field's `issues` will contain **all** the failed validations.

## Transforming values

If we take a look at how `Validator` is defined, we will notice that it has both
an input and an output type. While it's common that they are the same, this also
means that `Validators` can produce a value which is different than the one in
input.

:::note

This capability means that we're technically "parsing" instead of "validating"
the field values.

We sticked to "validation" to preserve familiarity with the term in the context
of forms.

[Here's an excellent blog post that explains the difference between parsing and
validating](https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/).

:::

One example of validation that transforms the value is the `validators.defined`
validator:

```tsx twoslash
import { FieldProps, NonEmptyArray } from "@buildo/formo";

type Props = FieldProps<string | undefined, string, NonEmptyArray<string>> & {
  options: Array<string>;
};

export const RadioGroup = (props: Props) => {
  return (
    <div>
      <label>{props.label}</label>
      {props.options.map((option) => (
        <>
          <input
            key={`input_${option}`}
            type="radio"
            id={option}
            name={props.name}
            value={option}
            onChange={(e) => props.onChange(e.currentTarget.value)}
            checked={option === props.value}
          />
          <label key={`label_${option}`} htmlFor={option}>
            {option}
          </label>
        </>
      ))}
      <ul>
        {props.issues?.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
};

// ---cut---
import { useFormo, validators, success } from "@buildo/formo";

type FormValues = {
  profession?: string;
};

export const MyForm = () => {
  const initialValues: FormValues = {
    profession: undefined,
  };

  const { fieldProps, handleSubmit } = useFormo(
    {
      initialValues,
      fieldValidators: (_) => ({
        profession: validators.defined("You must select a profession"),
      }),
    },
    {
      onSubmit: async (values) => success(values),
    }
  );

  return (
    <div>
      <RadioGroup
        label="Profession"
        options={["Developer", "Designer", "Other"]}
        {...fieldProps("profession")}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```

As we discussed, `onSubmit` is only ever called **after** all field validations
succeed, and this is reflected in the types.

In this example `profession` has type `string`, while the non-validated field is
`string | undefined`.

This is a very powerful capability, because it allows you to preserve in the
types some useful information you checked during validation.

:::info
Due to a known issue, a transforming validator value's type might result `unknown` in the `onSubmit` callback.

To avoid it, specify the the `fieldValidators` function argument and let the type inference do the work:

```
fieldValidators: (_) => ({
  profession: validators.defined("You must select a profession")
})
```

Otherwise, you can specify the type of each validator:

```
fieldValidators: () => ({
  profession: validators.defined<string | undefined, string>("You must select a profession"),
})
```

but it is not recommended due to verbosity and error-proness.
:::

## Defining custom validations

`formo` comes with a set of common validators, but you can of course augment
them by providing your own.

```twoslash include customvalidations
import {validators, success, failure } from "@buildo/formo";
// ---cut---
const startsWithUppercaseLetter = (errorMessage: string) => validators.regex(
  /^[A-Z]/, errorMessage
);
// - 1
// ---cut---
const perfectNumberValidator = (errorMessage: string) => validators.validator(
  (n: number) => n === 42 ? success(n) : failure(errorMessage)
);
// - 2
import { useFormo } from "@buildo/formo";
// ---cut---
const { fieldProps } = useFormo(
  {
    initialValues: {
      name: "",
      age: 0,
    },
    fieldValidators: () => ({
      name: startsWithUppercaseLetter("Name must start with uppercase letter"),
      age: perfectNumberValidator("Age must be 42"),
    }),
  },
  {
    onSubmit: async (values) => success(values),
  }
);
// - 3
```

For instance, you could leverage existing validators

```tsx twoslash
// @include: customvalidations-1
```

or create a completely custom one

```tsx twoslash
// @include: customvalidations-2
```

and use them accordingly

```tsx twoslash
// @include: customvalidations-3
```
