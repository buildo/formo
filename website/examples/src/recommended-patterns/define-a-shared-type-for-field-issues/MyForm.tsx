import { useFormo, validators, success } from "@buildo/formo";
import { error } from "./FieldIssue";
import { TextField } from "./TextField";

export const MyForm = () => {
  const { fieldProps } = useFormo(
    {
      initialValues: { name: "" },
      fieldValidators: () => ({
        name: validators.minLength(2, error("Name is too short")),
      }),
    },
    { onSubmit: async (values) => success(values.name) }
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
