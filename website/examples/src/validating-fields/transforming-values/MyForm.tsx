import { useFormo, validators, success } from "@buildo/formo";
import { RadioGroup } from "../../common/RadioGroup";

type FormValues = {
  profession?: string;
};

export const MyForm = () => {
  const initialValues: FormValues = {
    profession: undefined,
  };

  const { fieldProps, handleSubmit } = useFormo(
    {
      initialValues,
      fieldValidators: () => ({
        // Transform 'string | undefined' to 'string', if not possible the validator fails.
        profession: validators.defined<string | undefined, string>(
          "You must select a profession"
        ),
      }),
    },
    {
      onSubmit: async (values) => {
        console.log(typeof values.profession); // string
        return success(values);
      },
    }
  );

  return (
    <div>
      <RadioGroup
        label="Profession"
        options={["Developer", "Designer", "Other"]}
        {...fieldProps("profession")}
      />
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
