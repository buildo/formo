import { failure, success, useFormo } from "@buildo/formo";
import { SimpleTextField } from "../common/SimpleTextField";

const login = (username: string, password: string) => {
  if (username === "admin" && password === "password") {
    return success(undefined);
  } else {
    return failure("wrong username/password combination!");
  }
};

export const MyForm = () => {
  const {
    fieldProps,
    handleSubmit,
    isSubmitting,
    submissionCount,
    formErrors,
  } = useFormo(
    {
      initialValues: {
        username: "",
        password: "",
      },
      fieldValidators: () => ({}),
    },
    {
      onSubmit: async (values) => login(values.username, values.password),
    }
  );

  return (
    <div>
      <SimpleTextField label="username" {...fieldProps("username")} />
      <SimpleTextField label="password" {...fieldProps("password")} />

      <button onClick={handleSubmit} disabled={isSubmitting}>
        Login
      </button>

      {submissionCount > 0 && formErrors}
    </div>
  );
};
