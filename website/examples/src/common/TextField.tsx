import { FieldProps, NonEmptyArray } from "@buildo/formo";

type Props = FieldProps<string, string, NonEmptyArray<string>> & {
  placeholder: string;
};

export function TextField(props: Props) {
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
      <ul>
        {props.issues?.map((issue) => (
          <li key={`${props.name}_${issue}`}>{issue}</li>
        ))}
      </ul>
    </div>
  );
}
