---
id: recommended-patterns
title: Recommended patterns
---

In order to make the best out of `formo` we recommend a few patterns.

## Avoid using native form elements directly

`formo`'s utility functions are designed to return precise and type-safe data.
For instance, you may notice that `onChange` accepts a precise type (matching
`value`), as opposed to a more generic `Event`.

For this reason, we recommend defining your own wrappers for native form
elements, in order to gain type-safety.

It's likely that you are already be doing this in order to provide other
customizations for your project, so this is normally not a great change.

`formo` provides a `FieldProps` type that helps you create custom components for
your form elements.

For example, you may define your own `TextField` field as:

```twoslash include textfield
import { FieldProps, NonEmptyArray } from "@buildo/formo";

type Props = FieldProps<string, string, NonEmptyArray<string>> & {
  placeholder: string;
};

export function TextField(props: Props) {
  return (
    <div>
      <label>{props.label}</label>
      <input
        name={props.name}
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        onBlur={props.onBlur}
        disabled={props.disabled}
      />
      <ul>
        {props.issues?.map((issue) => (
          <li key={`${props.name}_${issue}`}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx twoslash
// @include: textfield
```

:::tip

You'll notice that `FieldProps` has three type parameters.

- The first one is the value type.
- The second one is the label type (which may or may not be a string)
- The third one is the field error type (encaplused in an `NonEmptyArray`)

In this example we've used `string` for all of them, but in a real project you
may have more specific types for the label (think of something like
`LocalizedString`, a `string` which has been localized) and for the field error
(perhaps a complex error object with additional info)

:::

Once you've done that, you can now see how `formo` utility methods (such as
`fieldProps`) become very convenient to use:

```tsx twoslash
// @include: textfield
// ---cut---
import { useFormo, validators, success } from "@buildo/formo";

export const MyForm = () => {
  const { fieldProps } = useFormo(
    {
      initialValues: {
        name: "",
      },
      fieldValidators: () => ({
        name: validators.maxLength(10, "Name is too long"),
      }),
    },
    {
      onSubmit: async (values) => success(values),
    }
  );

  return (
    <form>
      <TextField
        label="Name"
        placeholder="Ada Lovelace"
        {...fieldProps("name")}
      />
    </form>
  );
};
```

## Define a shared type for field issues

`formo` is agnostic in the specific type you use for field issues, but it's
highly recommended to define a fixed type for this and re-use it across your
application.

For instance:

```twoslash include fieldissues
export type Severity = "error" | "warning";
export type FieldIssue = { message: string; severity: Severity };

export const error = (message: string): FieldIssue => ({
  message,
  severity: "error",
});

export const warning = (message: string): FieldIssue => ({
  message,
  severity: "warning",
});
```

```ts twoslash
// @include: fieldissues
```

and then use it accordingly:

```ts twoslash
// @include: fieldissues
// ---cut---
import { useFormo, validators, success } from "@buildo/formo";

useFormo(
  {
    initialValues: { name: "" },
    fieldValidators: () => ({
      name: validators.minLength(2, error("Name is too short")),
    }),
  },
  {
    onSubmit: async (values) => success(values),
  }
);
```

With the same spirit, this should also be the type used by your field
components, so the `TextField` example above would have these props instead:

```ts twoslash
// @include: fieldissues
// ---cut---
import { FieldProps, NonEmptyArray } from "@buildo/formo";

type Props = FieldProps<string, string, NonEmptyArray<FieldIssue>> & {
  placeholder: string;
};
```
