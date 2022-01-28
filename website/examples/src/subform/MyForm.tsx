import { useFormo, subFormValue, success, validators } from "@buildo/formo";
import { SimpleTextField } from "../common/SimpleTextField";

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
            "Family member name is required"
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
      <SimpleTextField label="name" {...fieldProps("name")} />
      <SimpleTextField label="surname" {...fieldProps("surname")} />

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
            <SimpleTextField
              key={`${familyMember.namePrefix}-name`}
              label={`${index}-name`}
              {...familyMember.fieldProps("name")}
            />
            <SimpleTextField
              key={`${familyMember.namePrefix}-surname`}
              label={`${index}-surname`}
              {...familyMember.fieldProps("surname")}
            />
            {familyMember.fieldProps("name").issues}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit}>Login</button>
    </div>
  );
};
