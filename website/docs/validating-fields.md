---
id: validating-fields
title: Validating fields
---

`formo` supports validation of fields using using `Validator`s, a thin
abstraction layer over `ReaderTaskEither` from `fp-ts`.

Here's a quick example of a validator in action:

```twoslash include main
import { useFormo, validators } from "@buildo/formo";
import { taskEither } from "fp-ts";

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
    onSubmit: (values) => taskEither.right(values),
  }
);
```

```ts twoslash
// @include: main
```

Here we are validating the `name` field to make sure it's at least 2 character
long. The result of this validation can be access with:

```ts twoslash
// @include: main
// ---cut---
fieldProps("name").issues;
```

:::tip

The type of `issues` depends on the type of error passed to the validators.

For instance, if we were to use a validator like this:

```ts
validators.minLength(2, { message: "Name is too short", severity: 1 });
```

then the type of `issues` would be
`Option<NonEmptyArray<{ message: string, severity: number }>>`

:::

## Multiple validations on a field

Some fields may require multiple validations. We can combine validations using
the `inSequence` and `inParallel` combinators.

As the name suggests, `inSequence` runs validations one after the other and the
field's `issues` will contain the first validation that failed:

```ts
validators.inSequence(
  validators.minLength(2, "Too short"),
  validators.regex(/$[A-Z]/, "Must start with an uppercase letter")
);
```

Alternatively, we can run the same validations in parallel:

```ts
validators.inParallel(
  validators.minLength(2, "Too short"),
  validators.regex(/$[A-Z]/, "Must start with an uppercase letter")
);
```

In this case, the field's `issues` will contain all the failed validations.

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

Here's an excellent blog post that explains the difference between parsing and
validating: https://lexi-lambda.github.io/blog/2019/11/05/parse-don-t-validate/

:::

One example of validation that transforms the value is the `validators.defined`
validator:

```ts
useFormo(
  {
    initialValues: {
      profession: option.none as Option<string>,
    },
    fieldValidations: () => {
      profession: validators.defined("You must choose a profession");
    },
  },
  {
    onSubmit: ({ profession }) => {
      return taskEither.right(
        profession // profession is `string`, not `Option<string>`
      );
    },
  }
);
```

As we discussed, `onSubmit` is only ever called after all field validations
succeed, and this is reflected in the types.

In this example `profession` has type `string`, while the non-validated field is
an `Option<string>`.

This is a very powerful capability, because it allows you to preserve in the
types some useful information you checked during validation.

## Defining custom validations

`formo` comes with a set of common validators, but you can of course augment
them by providing your own.

For instance, you may leverage existing validators:

```ts
const startsWithUppercaseLetter = <E>(errorMessage: E) =>
  validators.regex(/$[A-Z]/, errorMessage);
```

or you could go completely custom using the `validator` combinator:

```ts
const perfectNumber = <E>(errorMessage) =>
  validators.validator((n: number) =>
    n === 42 ? either.right(i) : either.left(errorMessage)
  );
```

## Integrating with `io-ts`

[`io-ts`](https://github.com/gcanti/io-ts) is a library based on `fp-ts` which
provides utilities to encode/decode values based on runtime type.

If you have a `io-ts` type which you want to use for validation purposes, it's
quite simple to do it. For example, let's define a validator for the
`NonEmptyString` type provided by the
[`io-ts-types`](https://github.com/gcanti/io-ts-types) library.

```ts
import { validators } from "@buildo/formo";
import { NonEmptyString } from "io-ts-types/NonEmptyString";
import { either } from "fp-ts";
import { flow } from "fp-ts/function";

const nonEmptyString = <E>(
  errorMessage: E
): Validator<string, NonEmptyString, E> =>
  validators.validator(
    flow(NonEmptyString.decode, either.mapLeft(constant(errorMessage)))
  );
```
