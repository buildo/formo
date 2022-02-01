---
id: quick-start
title: Quick start
sidebar_label: Quick start
slug: /
---

## Installation

```bash
yarn install @buildo/formo
```

:::important

`formo` assumes `react` as peer dependencies, so make you have it
installed

:::

## Example

Here's a very basic example of how you _may_ use `formo`.

In the next sections we will see some reccomendations on how to make it even
more convenient to use.

```tsx twoslash
import { validators, useFormo, success } from "@buildo/formo";

export const MyForm = () => {
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
      onSubmit: async (values) => success(values),
    }
  );

  return (
    <div>
      <div>
        <label htmlFor={fieldProps("fullName").name} />
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
        <input
          type="checkbox"
          id={fieldProps("acceptsTerms").name}
          name={fieldProps("acceptsTerms").name}
          checked={fieldProps("acceptsTerms").value}
          onChange={(e) =>
            fieldProps("acceptsTerms").onChange(e.currentTarget.checked)
          }
          onBlur={fieldProps("acceptsTerms").onBlur}
        />
        <label htmlFor={fieldProps("acceptsTerms").name}>
          Accept terms and conditions
        </label>
        <p>
          {fieldProps("acceptsTerms").issues?.map((issue) => (
            <span key={issue}>{issue}</span>
          ))}
        </p>
      </div>

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
```
