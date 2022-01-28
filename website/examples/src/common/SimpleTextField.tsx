import { FieldProps, NonEmptyArray } from "@buildo/formo";

type Props = FieldProps<string, string, NonEmptyArray<unknown>>;

export function SimpleTextField(props: Props) {
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
    </div>
  );
}
