import { FieldProps, NonEmptyArray } from "@buildo/formo";
import { FieldIssue } from "./FieldIssue";

type Props = FieldProps<string, string, NonEmptyArray<FieldIssue>> & {
  placeholder: string;
};

export const TextField = (props: Props) => {
  return (
    <div>
      <label>{props.label}</label>
      <input
        name={props.name}
        type="text"
        value={props.value}
        onChange={(e) => props.onChange(e.currentTarget.value)}
        onBlur={props.onBlur}
        disabled={props.disabled}
      />
      <p>
        {props.issues?.map((issue) => (
          <span>{issue.message}</span>
        ))}
      </p>
    </div>
  );
};
