import { Option } from "fp-ts/Option";

export type FieldProps<V, Label, FieldError> = {
  name: string;
  value: V;
  onChange: (value: V) => unknown;
  onBlur: () => unknown;
  label: Label;
  issues: Option<FieldError>;
  disabled?: boolean;
};
