import { useFormo, validators, success } from "@buildo/formo";
import { TextField } from "../../common/TextField";

export const MyForm = () => {
  const { fieldProps } = useFormo(
    {
      initialValues: { name: "" },
      fieldValidators: () => ({
        name: validators.inParallel(
          validators.minLength(2, "Name is too short"),
          validators.regex(/^[A-Z]/, "Must start with an uppercase letter")
        ),
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
