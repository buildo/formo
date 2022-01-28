import { failure, success, useFormo } from "@buildo/formo";
import { TextField } from "./TextField";

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
      <TextField
        label="username"
        placeholder="Username"
        {...fieldProps("username")}
      />
      <TextField
        label="password"
        placeholder="Password"
        {...fieldProps("password")}
      />

      <button onClick={handleSubmit} disabled={isSubmitting}>
        Login
      </button>

      {submissionCount > 0 && formErrors}
    </div>
  );
};
