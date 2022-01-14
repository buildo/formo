import {
  useFormo,
  validators,
  success,
  failure,
  Validator,
} from "@buildo/formo";

export const MyForm = () => {
  // Leveraging existing validators
  const startsWithUppercaseLetter: <E>(
    errorMessage: E
  ) => Validator<string, string, E> = (errorMessage) =>
    validators.regex(/^[A-Z]/, errorMessage);

  // Completely custom using validator combinator
  const perfectNumberValidator = (errorMessage: string) =>
    validators.validator((n: number) =>
      n === 42 ? success(n) : failure(errorMessage)
    );

  const { fieldProps, fieldErrors } = useFormo(
    {
      initialValues: {
        name: "",
        age: 0,
      },
      fieldValidators: () => ({
        name: startsWithUppercaseLetter(
          "Name must start with uppercase letter"
        ),
        age: perfectNumberValidator("Age must be 42"),
      }),
    },
    {
      onSubmit: async (values) => success(values),
    }
  );

  return (
    <div>
      <label>{fieldProps("name").name}</label>
      <input
        type="text"
        {...fieldProps("name")}
        onChange={(e) => fieldProps("name").onChange(e.target.value)}
      />
      <label>{fieldProps("age").name}</label>
      <input
        type="number"
        {...fieldProps("age")}
        onChange={(e) => fieldProps("age").onChange(e.target.valueAsNumber)}
      />
      <ul>
        {Object.values(fieldErrors)?.map((issues) =>
          issues?.map((issue) => <li key={issue}>{issue}</li>)
        )}
      </ul>
    </div>
  );
};
