---
id: subform
title: Subform
---

import CodeBlock from "@theme/CodeBlock";

`formo` provides a simple way to create subforms.
A `subForm` is a nested form which requires different validations with respect to the container form.
The typical use case is when you have a field of a complex objects array.

For example, let's say you have a form asking the user their `name`, `surname` and `familyMembers`. The `familyMembers`, in turn, have their own fields (`name` and `surname`) that need to be validated _before_ being added to the user's field array.

```twoslash include textfield
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
```

```tsx twoslash
// @include: textfield
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
        <button onClick={() => subForm("familyMembers").push(initFamilyMember)}>
          Add family members
        </button>

        {subForm("familyMembers").items.map((familyMember, index) => (
          <div key={`${familyMember.namePrefix}-container`}>
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

## Initialization

```twoslash include defs
import { useFormo, subFormValue, success, validators } from "@buildo/formo";

type FamilyMember = {
  name: string;
  surname: string;
};
```

```twoslash include breakdown
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

```

Let's break down the code above.

The `subFormValue` API is required to initialize a subform.
If the initial state is an empty array, a casting is necessary to define the type of the array

```ts twoslash
// @include: defs
// ---cut---
subFormValue([] as Array<FamilyMember>);
//    ^?
```

otherwise, you can explicitly define the type of the assigned constant

```ts twoslash
// @include: defs
// ---cut---
const familiMembersInitialState: Array<FamilyMember> = [];
subFormValue(familiMembersInitialState);
//    ^?
```

The `subFormValidators` API works as the `fieldValidators`, but only acts on the `subForm` fields

```ts twoslash
// @include: defs
// ---cut---
// @include: breakdown
```

## Accessing sub forms

It can be noticed that `subForm` APIs are typesafely distinguished by the `fieldProps` ones.

In fact, with reference to the previous example, you can't pass `name` or `surname` as argument to `subForm`,
but only `familyMembers`

```ts twoslash
// @include: defs
// @include: breakdown
// ---cut---

// @errors: 2345
subForm("name");
subForm("surname");

subForm("familyMembers");
```

To add new elements, `inserAt` and `push` methods are available

```tsx twoslash
// @include: defs
// @include: breakdown
// ---cut---

subForm("familyMembers").insertAt;
//                        ^?
subForm("familyMembers").push;
//                        ^?
```

For example, to add a new family member with an initial state, you can use the `push` method inside a button `onClick`

```tsx twoslash
// @include: defs
// @include: breakdown
// ---cut---

const initFamilyMember = {
  name: "",
  surname: "",
};

<button onClick={() => subForm("familyMembers").push(initFamilyMember)}>
  Add family member
</button>;
```

To access all the created elements, use the `items` property

```ts twoslash
// @include: defs
// @include: breakdown
// ---cut---

subForm("familyMembers").items;
//                        ^?
```

Each item, in turn, provides the `fieldProps` API that can be used
to render a form element

```tsx twoslash
// @include: textfield
// @include: defs
// @include: breakdown
// ---cut---

subForm("familyMembers").items.map((familyMember, index) => (
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
));
```
