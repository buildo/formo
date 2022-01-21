import { useFormo, validators, success } from "@buildo/formo";
import { TextField } from "../../common/TextField";

export const MyForm = () => {
  const { fieldProps } = useFormo(
    {
      initialValues: {
        name: "",
      },
      fieldValidators: () => ({
        name: validators.minLength(2, "Name is too short"),
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
