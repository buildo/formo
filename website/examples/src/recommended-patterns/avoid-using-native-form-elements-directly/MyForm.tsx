import { useFormo, validators, success } from "@buildo/formo";
import { TextField } from "../../common/TextField";

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
