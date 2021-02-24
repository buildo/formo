import { renderHook, act } from "@testing-library/react-hooks";
import { useFormo, validators } from "../src";
import { constant, pipe } from "fp-ts/function";
import { nonEmptyArray, option, taskEither } from "fp-ts";
import { Option } from "fp-ts/Option";

describe("formo", () => {
  test("it works when calling multiple fields' onChange ", () => {
    const { result } = renderHook(() =>
      useFormo(
        {
          initialValues: {
            city: "Milan",
            zipCode: "20100",
          },
          fieldValidators: constant({}),
        },
        {
          onSubmit: () => taskEither.of(null),
        }
      )
    );

    expect(result.current.fieldProps("city").value).toBe("Milan");
    expect(result.current.fieldProps("zipCode").value).toBe("20100");

    act(() => {
      result.current.fieldProps("city").onChange("Rome");
      result.current.fieldProps("zipCode").onChange("");
    });

    expect(result.current.fieldProps("city").value).toBe("Rome");
    expect(result.current.fieldProps("zipCode").value).toBe("");
  });

  test("it works when calling onChange on an element of an array field", () => {
    const { result } = renderHook(() =>
      useFormo(
        {
          initialValues: {
            apples: [
              {
                type: "Granny Smith",
                quantity: 2,
              },
              {
                type: "Golden Delicious",
                quantity: 1,
              },
            ],
          },
          fieldValidators: constant({}),
        },
        {
          onSubmit: () => taskEither.of(null),
        }
      )
    );

    expect(
      result.current.fieldArray("apples").items[0].fieldProps("type").value
    ).toBe("Granny Smith");
    expect(
      result.current.fieldArray("apples").items[0].fieldProps("quantity").value
    ).toBe(2);

    act(() => {
      result.current
        .fieldArray("apples")
        .items[0].fieldProps("type")
        .onChange("Fuji");
    });

    expect(
      result.current.fieldArray("apples").items[0].fieldProps("type").value
    ).toBe("Fuji");
    expect(
      result.current.fieldArray("apples").items[0].fieldProps("quantity").value
    ).toBe(2);
  });

  test("it works when calling onChangeValues on an element of an array field", () => {
    const { result } = renderHook(() =>
      useFormo(
        {
          initialValues: {
            apples: [
              {
                type: "Granny Smith",
                quantity: 2,
              },
              {
                type: "Golden Delicious",
                quantity: 1,
              },
            ],
          },
          fieldValidators: constant({}),
        },
        {
          onSubmit: () => taskEither.of(null),
        }
      )
    );

    expect(
      result.current.fieldArray("apples").items[0].fieldProps("type").value
    ).toBe("Granny Smith");
    expect(
      result.current.fieldArray("apples").items[0].fieldProps("quantity").value
    ).toBe(2);

    act(() => {
      result.current.fieldArray("apples").items[0].onChangeValues({
        type: "Fuji",
        quantity: 10,
      });
    });

    expect(
      result.current.fieldArray("apples").items[0].fieldProps("type").value
    ).toBe("Fuji");
    expect(
      result.current.fieldArray("apples").items[0].fieldProps("quantity").value
    ).toBe(10);
  });

  describe("field validations", () => {
    test("validation shows field error and prevents submit", async () => {
      const onSubmit = jest.fn(() => taskEither.of(null));
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              firstName: "",
            },
            fieldValidators: () => ({
              firstName: validators.minLength(1, "required"),
            }),
          },
          { onSubmit }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(onSubmit).not.toHaveBeenCalled();

      expect(result.current.fieldProps("firstName").issues).toEqual(
        option.some(["required"])
      );

      await act(async () => {
        await result.current.fieldProps("firstName").onChange("Sarah");
        await result.current.handleSubmit();
      });

      expect(result.current.fieldProps("firstName").issues).toEqual(
        option.none
      );

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({ firstName: "Sarah" });
    });

    test("conditional validation works", async () => {
      const onSubmit = jest.fn(() => taskEither.of(null));
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              profession: option.none as Option<"employee" | "student">,
              industry: option.none as Option<"technology" | "health">,
            },
            fieldValidators: (values) => ({
              profession: validators.defined("required"),
              industry: pipe(
                values.profession,
                option.exists((p) => p === "employee")
              )
                ? validators.defined("required")
                : undefined,
            }),
          },
          { onSubmit }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      // no profession selected, so we only see an error about profession being missing
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.fieldProps("profession").issues).toEqual(
        option.some(["required"])
      );
      expect(result.current.fieldProps("industry").issues).toEqual(option.none);

      // select 'employee' as profession and try to submit
      await act(async () => {
        await result.current
          .fieldProps("profession")
          .onChange(option.some("employee"));
        await result.current.handleSubmit();
      });

      // now industry should show an error, since it's required when profession is 'employee'
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.fieldProps("industry").issues).toEqual(
        option.some(["required"])
      );

      // select an industry and submit
      await act(async () => {
        await result.current
          .fieldProps("industry")
          .onChange(option.some("health"));
        await result.current.handleSubmit();
      });

      expect(result.current.fieldProps("industry").issues).toEqual(option.none);
      expect(onSubmit).toHaveBeenLastCalledWith({
        profession: "employee",
        industry: "health",
      });

      // change profession to 'student', deselect industry and submit
      await act(async () => {
        await result.current
          .fieldProps("profession")
          .onChange(option.some("student"));
        await result.current.fieldProps("industry").onChange(option.none);
        await result.current.handleSubmit();
      });

      // now profession and industry are both ok, and industry is back to an Option (none) in submit
      expect(result.current.fieldProps("profession").issues).toEqual(
        option.none
      );
      expect(result.current.fieldProps("industry").issues).toEqual(option.none);
      expect(onSubmit).toHaveBeenLastCalledWith({
        profession: "student",
        industry: option.none,
      });
    });

    test("conditional field validation of many elements of an array field", async () => {
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              apples: [
                {
                  type: "",
                  quantity: 1,
                },
              ],
            },
            fieldValidators: constant({}),
            fieldArrayValidators: (values, index) => {
              return {
                apples: {
                  type: validators.minLength(1, "required"),
                  quantity:
                    values.apples[index].type !== ""
                      ? validators.fromPredicate((n: number) => n > 2, "error")
                      : undefined,
                },
              };
            },
          },
          {
            onSubmit: () => taskEither.of(null),
          }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(
        result.current.fieldArray("apples").items[0].fieldProps("type").issues
      ).toEqual(option.some(["required"]));
      expect(
        result.current.fieldArray("apples").items[0].fieldProps("quantity")
          .issues
      ).toEqual(option.none);

      await act(async () => {
        await result.current.fieldArray("apples").items[0].onChangeValues({
          type: "Fuji",
          quantity: 1,
        });
      });

      expect(
        result.current.fieldArray("apples").items[0].fieldProps("type").issues
      ).toEqual(option.none);
      expect(
        result.current.fieldArray("apples").items[0].fieldProps("quantity")
          .issues
      ).toEqual(option.some(["error"]));

      await act(async () => {
        await result.current.fieldArray("apples").items[0].onChangeValues({
          type: "",
          quantity: 2,
        });
      });

      expect(
        result.current.fieldArray("apples").items[0].fieldProps("type").issues
      ).toEqual(option.some(["required"]));
      expect(
        result.current.fieldArray("apples").items[0].fieldProps("quantity")
          .issues
      ).toEqual(option.none);
    });

    test("field array validation on removal", async () => {
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              apples: [
                {
                  type: "",
                  quantity: 0,
                },
                {
                  type: "Fuji",
                  quantity: 10,
                },
              ],
            },
            fieldValidators: constant({}),
            fieldArrayValidators: () => {
              return {
                apples: {
                  type: validators.minLength(1, "required"),
                  quantity: validators.fromPredicate(
                    (n: number) => n > 2,
                    "error"
                  ),
                },
              };
            },
          },
          {
            onSubmit: () => taskEither.of(null),
          }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(
        result.current.fieldArray("apples").items[0].fieldProps("type").issues
      ).toEqual(option.some(["required"]));
      expect(
        result.current.fieldArray("apples").items[0].fieldProps("quantity")
          .issues
      ).toEqual(option.some(["error"]));

      expect(
        result.current.fieldArray("apples").items[1].fieldProps("type").issues
      ).toEqual(option.none);
      expect(
        result.current.fieldArray("apples").items[1].fieldProps("quantity")
          .issues
      ).toEqual(option.none);

      await act(async () => {
        await result.current.fieldArray("apples").items[0].remove();
      });

      expect(
        result.current.fieldArray("apples").items[0].fieldProps("type").value
      ).toEqual("Fuji");
      expect(
        result.current.fieldArray("apples").items[0].fieldProps("quantity")
          .value
      ).toEqual(10);

      expect(
        result.current.fieldArray("apples").items[0].fieldProps("type").issues
      ).toEqual(option.none);
      expect(
        result.current.fieldArray("apples").items[0].fieldProps("quantity")
          .issues
      ).toEqual(option.none);
    });
  });

  describe("form validation", () => {
    test("formErrors are set via onSubmit", async () => {
      const onSubmit = jest.fn((s: string) => taskEither.of(s));

      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              username: "wrong",
              password: "wrong",
            },
            fieldValidators: constant({
              username: validators.minLength(1, "required"),
              password: validators.minLength(1, "required"),
            }),
          },
          {
            onSubmit: ({ username, password }) =>
              username === "username" && password === "password"
                ? taskEither.fromIO(() => onSubmit("token"))
                : taskEither.left(nonEmptyArray.of("LoginError")),
          }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      // onSubmit must not have been called because formValidator failed
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.formErrors).toEqual(option.some(["LoginError"]));

      await act(async () => {
        await result.current.fieldProps("username").onChange("username");
        await result.current.fieldProps("password").onChange("password");
        await result.current.handleSubmit();
      });

      expect(result.current.formErrors).toEqual(option.none);
      expect(onSubmit).toHaveBeenLastCalledWith("token");
    });
  });
});
