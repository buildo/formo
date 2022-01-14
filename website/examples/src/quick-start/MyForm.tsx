import { validators, useFormo, success } from "@buildo/formo";

export const MyForm = () => {
  const { fieldProps, handleSubmit } = useFormo(
    {
      initialValues: {
        fullName: "",
        acceptsTerms: false,
      },
      fieldValidators: () => ({
        acceptsTerms: validators.checked(
          "You must accept terms and conditions"
        ),
      }),
    },
    {
      onSubmit: async (values) => success(values),
    }
  );

  return (
    <div>
      <div>
        <label htmlFor={fieldProps("fullName").name} />
        <input
          type="text"
          id={fieldProps("fullName").name}
          name={fieldProps("fullName").name}
          value={fieldProps("fullName").value}
          onChange={(e) =>
            fieldProps("fullName").onChange(e.currentTarget.value)
          }
          onBlur={fieldProps("fullName").onBlur}
        />
      </div>

      <div>
        <input
          type="checkbox"
          id={fieldProps("acceptsTerms").name}
          name={fieldProps("acceptsTerms").name}
          checked={fieldProps("acceptsTerms").value}
          onChange={(e) =>
            fieldProps("acceptsTerms").onChange(e.currentTarget.checked)
          }
          onBlur={fieldProps("acceptsTerms").onBlur}
        />
        <label htmlFor={fieldProps("acceptsTerms").name}>
          Accept terms and conditions
        </label>
        <p>
          {fieldProps("acceptsTerms").issues?.map((issue) => (
            <span key={issue}>{issue}</span>
          ))}
        </p>
      </div>

      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};
