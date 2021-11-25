export type FieldProps<V, Label, FieldError> = {
  name: string;
  value: V;
  onChange: (value: V) => unknown;
  onBlur: () => unknown;
  label: Label;
  issues?: FieldError;
  disabled?: boolean;
};
