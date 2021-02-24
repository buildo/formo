---
id: submitting
title: Submitting a form
---

When defining a form, you are expected to return a `TaskEither` from the
`onSubmit` function.

```ts
import { useFormo } from "formo";

function login(
  username: string;
  password: string;
): TaskEither<string, void> {
  if (username === "admin" && password === "password") {
    return taskEither.right(undefined)
  } else {
    return taskEither.left("wrong username/password combination!")
  }
};

const { handleSubmit, isSubmitting, formErrors } = useFormo(
  {
    initialValues: {
      username: "",
      password: "",
    },
  },
  {
    onSubmit: (values) => login(values.username, values.password)
  }
);
```

In order to perform the form submission you can run `handleSubmit` (usually by
passing it to a `<button>` of some sort).

When the `handleSubmit` is run, a few things happen:

- `isSubmitting` becomes `true` until the `TaskEither` completes (either
  successfully or not)

- all fields are marked as "touched" and all field validations are run. If any
  of these validations fails, `onSubmit` is not run.

- if the `TaskEither` resolves to a "left", `formErrors` will contain the error
  returned (wrapped in an `Option`). This allows you - for instance - to display
  form-level errors originated during the form submittion.

- if the `TaskEither` resolves to a "right", the form submission has succeeded
  and `formErrors` will be `None`.
