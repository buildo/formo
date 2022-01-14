export type Severity = "error" | "warning";
export type FieldIssue = { message: string; severity: Severity };

export const error = (message: string): FieldIssue => ({
  message,
  severity: "error",
});

export const warning = (message: string): FieldIssue => ({
  message,
  severity: "warning",
});
