import { FieldProps, NonEmptyArray } from "@buildo/formo";

type Props = FieldProps<string | undefined, string, NonEmptyArray<string>> & {
  options: Array<string>;
};

export const RadioGroup = (props: Props) => {
  return (
    <div>
      <label>{props.label}</label>
      {props.options.map((option) => (
        <>
          <input
            key={`input_${option}`}
            type="radio"
            id={option}
            name={props.name}
            value={option}
            onChange={(e) => props.onChange(e.currentTarget.value)}
            checked={option === props.value}
          />
          <label key={`label_${option}`} htmlFor={option}>
            {option}
          </label>
        </>
      ))}
      <ul>
        {props.issues?.map((issue) => (
          <li key={issue}>{issue}</li>
        ))}
      </ul>
    </div>
  );
};
