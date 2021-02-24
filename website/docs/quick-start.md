---
id: quick-start
title: Quick start
sidebar_label: Quick start
slug: /
---

## Installation

```
yarn install formo
```

:::important

`formo` assumes `fp-ts` and `react` as peer dependencies, so make you have them
installed

:::

## Example

Here's a very basic example of how you _may_ use `formo`.

In the next sections we will see some reccomendations on how to make it even
more convenient to use.

```tsx
import { validations, useFormo } from "formo";
import { taskEither, option, array } from "fp-ts";
import { pipe, constNull } from "fp-ts/function";

function MyForm() {
  const { fieldProps, handleSubmit } = useFormo(
    {
      initialValues: {
        fullName: "",
        acceptsTerms: false,
      },
      fieldValidators: () => ({
        acceptsTerms: validators.checked(
          "You must accept terms and conditions"
        ),
      }),
    },
    {
      onSubmit: (values) => taskEither.right(values),
    }
  );

  return (
    <form>
      <div>
        <label for={fieldProps("fullName").name} />
        <input
          type="text"
          id={fieldProps("fullName").name}
          name={fieldProps("fullName").name}
          value={fieldProps("fullName").value}
          onChange={(e) =>
            fieldProps("fullName").onChange(e.currentTarget.value)
          }
          onBlur={fieldProps("fullName").onBlur}
        />
      </div>

      <div>
        <label for={fieldProps("acceptsTerms").name} />
        <input
          type="text"
          id={fieldProps("acceptsTerms").name}
          name={fieldProps("acceptsTerms").name}
          value={fieldProps("acceptsTerms").value}
          onChange={(e) =>
            fieldProps("acceptsTerms").onChange(e.currentTarget.checked)
          }
          onBlur={fieldProps("acceptsTerms").onBlur}
        />
        {pipe(
          fieldProps("acceptsTerms"),
          option.fold(constNull, (issues) =>
            pipe(
              issues,
              array.map((issue) => <span key={issue}>{issue}</span>)
            )
          )
        )}
      </div>

      <button type="submit" onClick={handleSubmit}>
        Submit
      </button>
    </form>
  );
}
```
