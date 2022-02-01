---
id: subform
title: Subform
---

import CodeBlock from "@theme/CodeBlock";

`formo` provides a simple way to create forms with subforms.
A `subForm` is a nested form which requires different validations with respect to the container form.
The typical use case is when you have an array field of complex objects.

For example, let's say you have a form asking the user their name, surname and family members:

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
import { useFormo, subFormValue, success, validators } from "@buildo/formo";

type FamilyMember = {
  name: string;
  surname: string;
};

export const MyForm = () => {
  const { handleSubmit, fieldProps, subForm, formErrors } = useFormo(
    {
      initialValues: {
        name: "Jhon",
        surname: "Doe",
        familyMembers: subFormValue([] as Array<FamilyMember>),
      },
      fieldValidators: () => ({}),
      subFormValidators: () => ({
        familyMembers: {
          name: validators.fromPredicate(
            (i) => typeof i === "string" && i.length > 0,
            "Family member name is required"
          ),
          surname: validators.fromPredicate(
            (i) => typeof i === "string" && i.length > 0,
            "Family member surname is required"
          ),
        },
      }),
    },
    {
      onSubmit: () => Promise.resolve(success(null)),
    }
  );

  const initFamilyMember = {
    name: "",
    surname: "",
  };

  return (
    <div>
      <TextField label="name" {...fieldProps("name")} />
      <TextField label="surname" {...fieldProps("surname")} />

      <div>
        <p>
          Family Members{" "}
          <button
            onClick={() => subForm("familyMembers").push(initFamilyMember)}
          >
            Add
          </button>
        </p>

        {subForm("familyMembers").items.map((familyMember, index) => (
          <div>
            <TextField
              key={`${familyMember.namePrefix}-name`}
              label={`${index}-name`}
              {...familyMember.fieldProps("name")}
            />
            <TextField
              key={`${familyMember.namePrefix}-surname`}
              label={`${index}-surname`}
              {...familyMember.fieldProps("surname")}
            />
            <p>
              {familyMember.fieldProps("name").issues}
              <br></br>
              {familyMember.fieldProps("surname").issues}
            </p>
          </div>
        ))}
      </div>

      <button onClick={handleSubmit}>Login</button>
    </div>
  );
};
```
