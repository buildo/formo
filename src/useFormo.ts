import { useReducer, Reducer, useState } from "react";
import { taskEither, record, option, array, nonEmptyArray, task } from "fp-ts";
import { FieldProps } from "./FieldProps";
import { pipe, constFalse, constant, constTrue } from "fp-ts/function";
import { NonEmptyArray } from "fp-ts/NonEmptyArray";
import { Option } from "fp-ts/Option";
import { Validator } from "./Validator";
import { sequenceS } from "fp-ts/Apply";
import { TaskEither } from "fp-ts/TaskEither";
import { IO } from "fp-ts/lib/IO";

type ComputedFieldProps<V, Label, Issues> = Pick<
  FieldProps<V, Label, Issues>,
  "name" | "value" | "onChange" | "onBlur" | "issues"
> & { isTouched: boolean; disabled: boolean };

type FieldValidators<Values> = {
  [k in keyof Values]: Validator<Values[k], unknown, unknown>;
};

type FieldArrayValidators<Values> = {
  [k in ArrayRecordKeys<Values>]: Partial<
    FieldValidators<
      ArrayRecord<Values, keyof ArrayRecordValues<Values> & string>[k][number]
    >
  >;
};

type GetOrElse<A, B> = A extends undefined | null ? B : NonNullable<A>;

type ValidatedValues<
  Values,
  Validators extends Partial<FieldValidators<Values>>,
  ArrayValidators extends Partial<FieldArrayValidators<Values>>
> = {
  [k in keyof Values]: Validators[k] extends Validator<
    Values[k],
    infer O,
    infer _E
  >
    ? O
    : Validators[k] extends Validator<Values[k], infer O, infer _E> | undefined
    ? O | Values[k]
    : k extends ArrayRecordKeys<Values>
    ? ValidatedValues<
        ArrayRecord<
          Values,
          keyof ArrayRecordValues<Values> & string
        >[k][number],
        GetOrElse<ArrayValidators[k], {}>,
        {}
      >[]
    : Values[k];
};

type FormOptions<
  Values,
  Validators extends Partial<FieldValidators<Values>>,
  ArrayValidators extends Partial<FieldArrayValidators<Values>>,
  FormErrors
> = [
  {
    initialValues: Values;
    fieldValidators: (values: Values) => Validators;
    fieldArrayValidators?: (values: Values, index: number) => ArrayValidators;
  },
  {
    onSubmit: (
      values: ValidatedValues<Values, Validators, ArrayValidators>
    ) => TaskEither<FormErrors, unknown>;
  }
];

type ArrayRecord<Values, SK extends string> = {
  [K in keyof Values]: Values[K] extends { [k in SK]: unknown }[]
    ? Values[K]
    : never;
};

type ArrayRecordKeys<Values> = {
  [K in keyof Values]-?: Values[K] extends Record<string, unknown>[]
    ? K
    : never;
}[keyof Values] &
  string;

type ArrayRecordValues<Values> = {
  [K in keyof Values]-?: Values[K] extends Record<string, unknown>[]
    ? Values[K][number]
    : never;
}[keyof Values];

type FormAction<Values, FormErrors, FieldError> =
  | {
      type: "setValues";
      values: Partial<Values>;
    }
  | {
      type: "setTouched";
      touched: Partial<Record<keyof Values, boolean>>;
    }
  | {
      type: "setErrors";
      field: keyof Values;
      errors: Option<NonEmptyArray<FieldError>>;
    }
  | {
      type: "setFieldArrayTouched";
      field: ArrayRecordKeys<Values>;
      index: number;
      subfield: string;
      touched: boolean;
    }
  | {
      type: "setFieldArrayErrors";
      field: ArrayRecordKeys<Values>;
      index: number;
      subfield: string;
      errors: Option<NonEmptyArray<FieldError>>;
    }
  | {
      type: "setFormError";
      errors: Option<FormErrors>;
    }
  | {
      type: "setSubmitting";
      isSubmitting: boolean;
    }
  | {
      type: "reset";
      state: FormState<Values, FormErrors, FieldError>;
    };

type FieldArray<
  Values extends Record<string, unknown>,
  K extends ArrayRecordKeys<Values>,
  Label,
  FieldError
> = {
  items: {
    fieldProps: <
      SK extends keyof ArrayRecordValues<Values> & string,
      V extends ArrayRecord<Values, SK>
    >(
      name: SK
    ) => ComputedFieldProps<V[K][number][SK], Label, NonEmptyArray<FieldError>>;
    onChangeValues: <
      SK extends keyof ArrayRecordValues<Values> & string,
      V extends ArrayRecord<Values, SK>
    >(
      v: V[K][number]
    ) => unknown;
    remove: () => void;
    namePrefix: string;
  }[];
  insertAt: <
    SK extends keyof ArrayRecordValues<Values> & string,
    V extends ArrayRecord<Values, SK>
  >(
    index: number,
    value: V[K][number]
  ) => void;
  push: <
    SK extends keyof ArrayRecordValues<Values> & string,
    V extends ArrayRecord<Values, SK>
  >(
    value: V[K][number]
  ) => void;
};

interface FormState<Values, FormErrors, FieldError> {
  values: Values;
  touched: Record<keyof Values, boolean>;
  errors: Record<keyof Values, Option<NonEmptyArray<FieldError>>>;
  formErrors: Option<FormErrors>;
  isSubmitting: boolean;
  fieldArrayTouched: Record<
    ArrayRecordKeys<Values>,
    Partial<Record<keyof ArrayRecordValues<Values>, boolean>>[]
  >;
  fieldArrayErrors: Record<
    ArrayRecordKeys<Values>,
    {
      [K in keyof ArrayRecordValues<Values>]?:
        | Option<NonEmptyArray<FieldError>>
        | undefined;
    }[]
  >;
}

function formReducer<Values, FormErrors, FieldError>(
  state: FormState<Values, FormErrors, FieldError>,
  action: FormAction<Values, FormErrors, FieldError>
): FormState<Values, FormErrors, FieldError> {
  switch (action.type) {
    case "setValues":
      return { ...state, values: { ...state.values, ...action.values } };
    case "setTouched":
      return { ...state, touched: { ...state.touched, ...action.touched } };
    case "setErrors":
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.errors },
      };
    case "setFieldArrayTouched":
      const updatedTouchedField = pipe(
        state.fieldArrayTouched[action.field][action.index],
        option.fromNullable,
        option.alt(constant(option.some({}))),
        option.map((v) =>
          array.unsafeUpdateAt(
            action.index,
            { ...v, [action.subfield]: action.touched },
            state.fieldArrayTouched[action.field]
          )
        )
      );
      return pipe(
        updatedTouchedField,
        option.fold(
          () => state,
          (updatedField) => ({
            ...state,
            fieldArrayTouched: {
              ...state.fieldArrayTouched,
              [action.field]: updatedField,
            },
          })
        )
      );
    case "setFieldArrayErrors":
      const updatedErrorsField = pipe(
        state.fieldArrayErrors[action.field][action.index],
        option.fromNullable,
        option.alt(constant(option.some({}))),
        option.map((v) =>
          array.unsafeUpdateAt(
            action.index,
            { ...v, [action.subfield]: action.errors },
            state.fieldArrayErrors[action.field]
          )
        )
      );

      return pipe(
        updatedErrorsField,
        option.fold(
          () => state,
          (updatedField) => ({
            ...state,
            fieldArrayErrors: {
              ...state.fieldArrayErrors,
              [action.field]: updatedField,
            },
          })
        )
      );
    case "setFormError":
      return {
        ...state,
        formErrors: action.errors,
      };
    case "setSubmitting":
      return { ...state, isSubmitting: action.isSubmitting };
    case "reset":
      return action.state;
  }
}

type UseFormReturn<
  Values extends Record<string, unknown>,
  FormErrors,
  Label,
  FieldError
> = {
  values: Values;
  setValues: (values: Partial<Values>) => void;
  setTouched: (values: Partial<Record<keyof Values, boolean>>) => void;
  fieldProps: <K extends keyof Values & string>(
    name: K
  ) => ComputedFieldProps<Values[K], Label, NonEmptyArray<FieldError>>;
  handleSubmit: TaskEither<unknown, unknown>;
  isSubmitting: boolean;
  fieldArray: <K extends ArrayRecordKeys<Values>>(
    name: K
  ) => FieldArray<Values, K, Label, FieldError>;
  formErrors: Option<FormErrors>;
  fieldErrors: Record<keyof Values, Option<NonEmptyArray<FieldError>>>;
  resetForm: IO<void>;
  submissionCount: number;
};

type ValidatorErrorType<
  Values extends Record<string, unknown>,
  V extends Partial<FieldValidators<Values>>
> = V extends Partial<
  {
    [k in keyof Values]: Validator<Values[k], unknown, infer E>;
  }
>
  ? E
  : null;

export function useFormo<
  Values extends Record<string, unknown>,
  Validators extends Partial<FieldValidators<Values>>,
  ArrayValidators extends Partial<FieldArrayValidators<Values>>,
  FormErrors,
  Label
>(
  ...args: FormOptions<Values, Validators, ArrayValidators, FormErrors>
): UseFormReturn<
  Values,
  FormErrors,
  Label,
  ValidatorErrorType<Values, Validators>
> {
  type Touched = Record<keyof Values, boolean>;
  type FieldError = ValidatorErrorType<Values, Validators>;

  type Errors = Record<keyof Values, Option<NonEmptyArray<FieldError>>>;
  type FieldArrayErrors = Record<
    ArrayRecordKeys<Values>,
    Record<keyof ArrayRecordValues<Values>, Option<NonEmptyArray<FieldError>>>[]
  >;
  type FieldArrayTouched = Record<
    ArrayRecordKeys<Values>,
    Record<keyof ArrayRecordValues<Values>, boolean>[]
  >;

  const { initialValues, fieldValidators, fieldArrayValidators } = args[0];
  const { onSubmit } = args[1];

  const [submissionCount, setSubmissionCount] = useState(0);

  function isArrayValue(v: unknown): v is Record<string, unknown>[] {
    // NOTE(gabro): this is a loose check, we are not really checking all
    // elements are Record <string, unknown> but we statically enforce that using
    // the types
    return Array.isArray(v);
  }

  const arrayValues = (
    values: Values
  ): Record<
    ArrayRecordKeys<Values>,
    Record<keyof ArrayRecordValues<Values>, unknown>[]
  > =>
    pipe(values, record.filter(isArrayValue)) as Record<
      ArrayRecordKeys<Values>,
      Record<keyof ArrayRecordValues<Values>, unknown>[]
    >;

  const initialState = {
    values: initialValues,
    touched: pipe(initialValues, record.map(constFalse)) as Touched,
    errors: pipe(initialValues, record.map(constant(option.none))) as Errors,
    formErrors: option.none,
    isSubmitting: false,
    fieldArrayErrors: pipe(
      arrayValues(initialValues),
      record.map(array.map(record.map(constant(option.none))))
    ) as FieldArrayErrors,
    fieldArrayTouched: pipe(
      arrayValues(initialValues),
      record.map(array.map(record.map(constFalse)))
    ) as FieldArrayTouched,
  };

  const [
    {
      values,
      isSubmitting,
      touched,
      errors,
      formErrors,
      fieldArrayErrors,
      fieldArrayTouched,
    },
    dispatch,
  ] = useReducer<
    Reducer<
      FormState<Values, FormErrors, FieldError>,
      FormAction<Values, FormErrors, FieldError>
    >
  >(formReducer, initialState);

  const setValues = (partialValues: Partial<Values>) => {
    dispatch({ type: "setValues", values: partialValues });

    const newValues = { ...values, ...partialValues };
    pipe(
      partialValues as Values,
      record.traverseWithIndex(task.taskSeq)((key) =>
        validateField(key, newValues)
      )
    )();
  };

  const setTouched = (partialTouched: Partial<Touched>) => {
    const partialTouchedChanged = pipe(
      partialTouched,
      record.filterWithIndex((k, isTouch) => touched[k] !== isTouch)
    ) as Partial<Touched>;

    if (!record.size(partialTouchedChanged)) {
      return;
    }

    dispatch({ type: "setTouched", touched: partialTouchedChanged });
  };

  const setErrors = <K extends keyof Values & string>(
    k: K,
    newErrors: Option<NonEmptyArray<FieldError>>
  ) => {
    if (option.isNone(errors[k]) && option.isNone(newErrors)) {
      return;
    }

    dispatch({ type: "setErrors", field: k, errors: newErrors });
  };

  const setFormErrors = (errors: Option<FormErrors>) => {
    if (option.isNone(formErrors) && option.isNone(errors)) {
      return;
    }

    dispatch({ type: "setFormError", errors });
  };

  const fieldProps = <K extends keyof Values & string>(
    name: K
  ): ComputedFieldProps<Values[K], Label, NonEmptyArray<FieldError>> => {
    return {
      name,
      value: values[name],
      onChange: (v: Values[K]) => {
        setValues(({ [name]: v } as unknown) as Partial<Values>);
        const newValues = { ...values, [name]: v } as Values;
        return validateField(name, newValues)();
      },
      onBlur: () => {
        setTouched(({ [name]: true } as unknown) as Partial<Touched>);
        return validateField(name, values)();
      },
      issues: pipe(
        errors[name],
        option.filter(() => touched[name])
      ),
      isTouched: touched[name],
      disabled: isSubmitting,
    };
  };

  const getValidations = (values: Values) =>
    pipe(
      fieldValidators,
      option.fromNullable,
      option.map((validator) => validator(values))
    );

  const validateField = <K extends keyof Values & string>(
    name: K,
    values: Values
  ) =>
    pipe(
      getValidations(values),
      option.chain((validations) => option.fromNullable(validations[name])),
      option.map((fieldValidation) =>
        pipe(
          values[name],
          fieldValidation,
          taskEither.bimap(
            (errors) => {
              setErrors(name, option.some(errors as NonEmptyArray<FieldError>));
              return errors;
            },
            (a) => {
              setErrors(name, option.none);
              return a;
            }
          )
        )
      ),
      option.getOrElseW(() =>
        taskEither.rightIO<NonEmptyArray<FieldError>, Values[K]>(() => {
          setErrors(name, option.none);
          return values[name];
        })
      )
    );

  const validateSubfield = <
    SK extends keyof ArrayRecordValues<Values> & string,
    K extends ArrayRecordKeys<Values>,
    V extends ArrayRecord<Values, SK>
  >(
    name: K,
    index: number,
    subfieldName: SK,
    values: Values
  ) =>
    pipe(
      fieldArrayValidators,
      option.fromNullable,
      option.chainNullableK((validators) => validators(values, index)),
      option.chainNullableK((validations) => validations[name]),
      option.chainNullableK((validation) => validation![subfieldName]),
      option.map((subfieldValidation) =>
        pipe(
          (values as V)[name][index][subfieldName] as any,
          subfieldValidation!,
          taskEither.bimap(
            (e: NonEmptyArray<FieldError>) => {
              dispatch({
                type: "setFieldArrayErrors",
                field: name,
                index,
                subfield: subfieldName,
                errors: option.some(e),
              });
              return e;
            },
            (a) => {
              dispatch({
                type: "setFieldArrayErrors",
                field: name,
                index,
                subfield: subfieldName,
                errors: option.none,
              });
              return a;
            }
          )
        )
      ),
      option.getOrElseW(() =>
        taskEither.rightIO<NonEmptyArray<FieldError>, Values[K]>(() => {
          setErrors(name, option.none);
          dispatch({
            type: "setFieldArrayErrors",
            field: name,
            index,
            subfield: subfieldName,
            errors: option.none,
          });
          return values[name];
        })
      )
    );

  const validateSubform = <
    SK extends keyof ArrayRecordValues<Values> & string,
    K extends ArrayRecordKeys<Values>,
    V extends ArrayRecord<Values, SK>
  >(
    values: V,
    index: number,
    name: K
  ): TaskEither<
    NonEmptyArray<FieldError>,
    ValidatedValues<
      ArrayRecord<Values, keyof ArrayRecordValues<Values> & string>[K][number],
      GetOrElse<ArrayValidators[K], {}>,
      {}
    >
  > => {
    return record.traverseWithIndex(
      taskEither.getTaskValidation(nonEmptyArray.getSemigroup<FieldError>())
    )((subfieldName) => validateSubfield(name, index, subfieldName, values))(
      values[name][index]
    ) as any;
  };

  const validateAllSubforms = <
    SK extends keyof ArrayRecordValues<Values> & string,
    K extends ArrayRecordKeys<Values>,
    V extends ArrayRecord<Values, SK>
  >(
    values: Values
  ): Record<K, TaskEither<NonEmptyArray<FieldError>, any>> =>
    pipe(
      arrayValues(values),
      record.mapWithIndex((name, subforms) =>
        pipe(
          subforms,
          array.traverseWithIndex(
            taskEither.getTaskValidation(
              nonEmptyArray.getSemigroup<FieldError>()
            )
          )((index) => validateSubform<SK, K, V>(values as V, index, name))
        )
      )
    );

  const validateAllFields = (
    values: Values
  ): TaskEither<
    NonEmptyArray<FieldError>,
    ValidatedValues<Values, Validators, ArrayValidators>
  > =>
    pipe(
      values,
      record.mapWithIndex((name) => validateField(name, values)),
      (fieldValidations) =>
        sequenceS(
          taskEither.getTaskValidation(nonEmptyArray.getSemigroup<FieldError>())
        )({
          ...fieldValidations,
          ...validateAllSubforms(values),
        } as any)
    ) as any;

  const setAllTouched = () => {
    setTouched(
      (pipe(values, record.map(constTrue)) as unknown) as Partial<Touched>
    );
    pipe(
      arrayValues(values),
      record.mapWithIndex((field, v) =>
        pipe(
          v,
          array.mapWithIndex((index, r) =>
            pipe(
              r,
              record.mapWithIndex((subfield) =>
                dispatch({
                  type: "setFieldArrayTouched",
                  field,
                  index,
                  subfield,
                  touched: true,
                })
              )
            )
          )
        )
      )
    );
  };

  const fieldArray = <K extends ArrayRecordKeys<Values>>(
    name: K
  ): FieldArray<Values, K, Label, FieldError> => {
    function namePrefix(index: number): string {
      return `${name}[${index}]`;
    }

    const fieldProps = <
      SK extends keyof ArrayRecordValues<Values> & string,
      V extends ArrayRecord<Values, SK>
    >(
      index: number
    ): ((
      subfieldName: SK
    ) => ComputedFieldProps<
      V[K][number][SK],
      Label,
      NonEmptyArray<FieldError>
    >) => {
      return (subfieldName) => {
        const isTouched = pipe(
          fieldArrayTouched[name][index],
          option.fromNullable,
          option.chainNullableK((e) => e[subfieldName]),
          option.exists((e) => !!e)
        );

        return {
          name: `${namePrefix(index)}.${subfieldName}`,
          value: (values as V)[name][index][subfieldName] as V[K][number][SK],
          onChange: (value: V[K][number][SK]) => {
            pipe(
              (values as V)[name][index] as V[K][number],
              record.updateAt(subfieldName, value),
              option.chain((value) =>
                array.updateAt(
                  index,
                  value
                )(values[name] as Array<Record<SK, V[K][number][SK]>>)
              ),
              option.map((updatedArray) => {
                const newValues = { [name]: updatedArray } as Partial<Values>;
                setValues(newValues);
                validateSubfield(name, index, subfieldName, {
                  ...values,
                  ...newValues,
                })();
              })
            );
          },
          onBlur: () => {
            dispatch({
              type: "setFieldArrayTouched",
              field: name,
              index,
              subfield: subfieldName,
              touched: true,
            });
          },
          issues: pipe(
            fieldArrayErrors[name][index],
            option.fromNullable,
            option.chain((e) => option.fromNullable(e[subfieldName])),
            option.flatten,
            option.filter(() => isTouched)
          ),
          isTouched,
          disabled: isSubmitting,
        };
      };
    };

    function onChangeValues<
      SK extends keyof ArrayRecordValues<Values> & string,
      V extends ArrayRecord<Values, SK>
    >(index: number): (elementValues: V[K][number]) => void {
      return (elementValues) =>
        pipe(
          array.updateAt(
            index,
            elementValues
          )(values[name] as Array<Record<SK, V[K][number][SK]>>),
          option.map((updatedArray) => {
            const newValues = { [name]: updatedArray } as Partial<Values>;
            setValues(newValues);
            validateSubform<SK, K, V>(
              { ...values, ...newValues } as V,
              index,
              name
            )();
          })
        );
    }

    function remove<
      SK extends keyof ArrayRecordValues<Values> & string,
      V extends ArrayRecord<Values, SK>
    >(index: number): () => void {
      return () =>
        pipe(
          (values as V)[name],
          array.deleteAt(index),
          option.map((updatedArray) => {
            setValues({ [name]: updatedArray } as Partial<Values>);
            const newValues = {
              ...values,
              [name]: updatedArray,
            } as Values;
            record.sequence(
              taskEither.getTaskValidation(
                nonEmptyArray.getSemigroup<FieldError>()
              )
            )(validateAllSubforms(newValues))();
          })
        );
    }

    const items: FieldArray<
      Values,
      K,
      Label,
      FieldError
    >["items"] = (values as ArrayRecord<Values, string>)[name].map(
      (_value, index) => ({
        fieldProps: fieldProps(index),
        onChangeValues: onChangeValues(index),
        remove: remove(index),
        namePrefix: namePrefix(index),
      })
    );

    const insertAt: FieldArray<Values, K, Label, FieldError>["insertAt"] = <
      SK extends keyof ArrayRecordValues<Values> & string,
      V extends ArrayRecord<Values, SK>
    >(
      index: number,
      value: V[K][number]
    ) => {
      pipe(
        (values as V)[name],
        array.insertAt(index, value),
        option.map((updatedArray) => {
          setValues({ [name]: updatedArray } as Partial<Values>);
        })
      );
    };

    const push: FieldArray<Values, K, Label, FieldError>["push"] = <
      SK extends keyof ArrayRecordValues<Values> & string,
      V extends ArrayRecord<Values, SK>
    >(
      value: V[K][number]
    ) => insertAt<SK, V>((values as V)[name].length, value);

    return {
      items,
      push,
      insertAt,
    };
  };

  const validateFormAndSubmit = (
    values: ValidatedValues<Values, Validators, ArrayValidators>
  ): TaskEither<void, void> =>
    pipe(
      onSubmit(values),
      taskEither.bimap(
        (errors) => {
          setFormErrors(option.some(errors));
        },
        () => {
          setFormErrors(option.none);
        }
      )
    );

  const handleSubmit: TaskEither<unknown, void> = taskEither.bracket(
    taskEither.rightIO(() => {
      setAllTouched();
      dispatch({ type: "setSubmitting", isSubmitting: true });
      setSubmissionCount((count) => count + 1);
    }),
    () =>
      pipe(validateAllFields(values), taskEither.chainW(validateFormAndSubmit)),
    () =>
      taskEither.rightIO(() => {
        dispatch({ type: "setSubmitting", isSubmitting: false });
      })
  );

  const resetForm: IO<void> = () => {
    dispatch({ type: "reset", state: initialState });
  };

  return {
    values,
    setValues,
    setTouched,
    fieldProps,
    handleSubmit,
    isSubmitting,
    fieldArray,
    formErrors,
    fieldErrors: errors,
    resetForm,
    submissionCount,
  };
}
