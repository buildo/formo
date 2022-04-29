---
id: submitting
title: Submitting a form
---

When defining a form, the `onSubmit` function is expected to return a `Promise<Result>`,
where `Result` can either be `Success` or `Failure`.

```tsx twoslash
import { FieldProps, NonEmptyArray } from "@buildo/formo";

type Props = FieldProps<string, string, NonEmptyArray<unknown>>;

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
    </div>
  );
}
// ---cut---
import { failure, success, useFormo } from "@buildo/formo";

const login = (username: string, password: string) => {
  if (username === "admin" && password === "password") {
    return success(undefined);
  } else {
    return failure("wrong username/password combination!");
  }
};

export const MyForm = () => {
  const { fieldProps, handleSubmit, isSubmitting, formErrors } = useFormo(
    {
      initialValues: {
        username: "",
        password: "",
      },
      fieldValidators: () => ({}),
    },
    {
      onSubmit: async (values) => login(values.username, values.password),
    }
  );

  return (
    <div>
      <TextField label="username" {...fieldProps("username")} />
      <TextField label="password" {...fieldProps("password")} />

      <button onClick={handleSubmit} disabled={isSubmitting}>
        Login
      </button>

      {formErrors}
    </div>
  );
};
```

In order to perform the form submission you can run `handleSubmit` (usually by
passing it to a `<button>` of some sort).

When the `handleSubmit` is run, a few things happen:

- `isSubmitting` becomes `true` until the `Promise` completes (either
  successfully or not)

- all fields `isTouched` are marked as `true` and all field validations are run. If any
  of these validations fails, `onSubmit` is not run.

- if the `Promise` resolves to a `Failure`, `formErrors` will contain the error
  returned. This allows you - for instance - to display
  form-level errors originated during the form submittion.

- if the `Promise` resolves to a `Success`, the form submission has succeeded
  and `formErrors` will be `undefined`.
