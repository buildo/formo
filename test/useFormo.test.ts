import { renderHook, act } from "@testing-library/react-hooks";
import { subFormValue, useFormo, validators } from "../src";
import { failure, success } from "../src/Result";

describe("formo", () => {
  test("it works when calling multiple fields' onChange ", () => {
    const { result } = renderHook(() =>
      useFormo(
        {
          initialValues: {
            city: "Milan",
            zipCode: "20100",
          },
          fieldValidators: () => ({}),
        },
        {
          onSubmit: () => Promise.resolve(success(null)),
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

  test("it works when resetting the form", () => {
    const { result, rerender } = renderHook(
      (initialValues) =>
        useFormo(
          {
            initialValues,
            fieldValidators: () => ({}),
          },
          {
            onSubmit: () => Promise.resolve(success(null)),
          }
        ),
      {
        initialProps: {
          city: "Milan",
          zipCode: "20100",
        },
      }
    );

    act(() => {
      result.current.fieldProps("city").onChange("Rome");
      result.current.fieldProps("zipCode").onChange("");
    });

    rerender({
      city: "Rome",
      zipCode: "",
    });

    expect(result.current.fieldProps("city").value).toBe("Rome");
    expect(result.current.fieldProps("zipCode").value).toBe("");

    act(() => {
      result.current.resetForm();
    });

    expect(result.current.fieldProps("city").value).toBe("Milan");
    expect(result.current.fieldProps("zipCode").value).toBe("20100");
  });

  test("it works when calling onChange on a field of type array", async () => {
    const onSubmit = jest.fn((values) => Promise.resolve(success(null)));
    const { result } = renderHook(() =>
      useFormo(
        {
          initialValues: {
            apples: ["Granny Smith", "Golden Delicious"],
          },
          fieldValidators: () => ({}),
        },
        {
          onSubmit,
        }
      )
    );

    expect(result.current.fieldProps("apples").value).toEqual([
      "Granny Smith",
      "Golden Delicious",
    ]);

    act(() => {
      result.current.fieldProps("apples").onChange(["Granny Smith", "Fuji"]);
    });

    expect(result.current.fieldProps("apples").value).toEqual([
      "Granny Smith",
      "Fuji",
    ]);

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ apples: ["Granny Smith", "Fuji"] });
  });

  test("it works when calling onChange on an element of an array field", () => {
    const { result } = renderHook(() =>
      useFormo(
        {
          initialValues: {
            apples: subFormValue([
              {
                type: "Granny Smith",
                quantity: 2,
              },
              {
                type: "Golden Delicious",
                quantity: 1,
              },
            ]),
          },
          fieldValidators: () => ({}),
        },
        {
          onSubmit: () => Promise.resolve(success(null)),
        }
      )
    );

    expect(
      result.current.subForm("apples").items[0].fieldProps("type").value
    ).toBe("Granny Smith");
    expect(
      result.current.subForm("apples").items[0].fieldProps("quantity").value
    ).toBe(2);

    act(() => {
      result.current
        .subForm("apples")
        .items[0].fieldProps("type")
        .onChange("Fuji");
    });

    expect(
      result.current.subForm("apples").items[0].fieldProps("type").value
    ).toBe("Fuji");
    expect(
      result.current.subForm("apples").items[0].fieldProps("quantity").value
    ).toBe(2);
  });

  test("it works when calling onChangeValues on an element of an array field", async () => {
    const { result } = renderHook(() =>
      useFormo(
        {
          initialValues: {
            apples: subFormValue([
              {
                type: "Granny Smith",
                quantity: 2,
              },
              {
                type: "Golden Delicious",
                quantity: 1,
              },
            ]),
          },
          fieldValidators: () => ({}),
        },
        {
          onSubmit: () => Promise.resolve(success(null)),
        }
      )
    );

    expect(
      result.current.subForm("apples").items[0].fieldProps("type").value
    ).toBe("Granny Smith");
    expect(
      result.current.subForm("apples").items[0].fieldProps("quantity").value
    ).toBe(2);

    await act(async () => {
      await result.current.subForm("apples").items[0].onChangeValues({
        type: "Fuji",
        quantity: 10,
      });
    });

    expect(
      result.current.subForm("apples").items[0].fieldProps("type").value
    ).toBe("Fuji");
    expect(
      result.current.subForm("apples").items[0].fieldProps("quantity").value
    ).toBe(10);
  });

  test("handleSubmit does not refer to stale values", async () => {
    const onSubmit = jest.fn(async () => success(null));
    const { result } = renderHook(() =>
      useFormo(
        {
          initialValues: {
            city: "Milan",
          },
          fieldValidators: (_) => ({}),
        },
        {
          onSubmit,
        }
      )
    );

    expect(result.current.fieldProps("city").value).toBe("Milan");

    await act(async () => {
      result.current.setValues({ city: "Rome" });
      result.current.handleSubmit();
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith({ city: "Rome" });
  });

  describe("field validations", () => {
    test("validation shows field error and prevents submit", async () => {
      const onSubmit = jest.fn(() => Promise.resolve(success(null)));
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

      expect(result.current.fieldProps("firstName").issues).toEqual([
        "required",
      ]);

      await act(async () => {
        await result.current.fieldProps("firstName").onChange("Sarah");
        await result.current.handleSubmit();
      });

      expect(result.current.fieldProps("firstName").issues).toEqual(undefined);

      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(onSubmit).toHaveBeenCalledWith({ firstName: "Sarah" });
    });

    test("conditional validation works", async () => {
      const onSubmit = jest.fn(() => Promise.resolve(success(null)));
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              profession: undefined as undefined | "employee" | "student",
              industry: undefined as undefined | "technology" | "health",
            },
            fieldValidators: (values) => ({
              profession: validators.defined("required"),
              industry:
                values.profession === "employee"
                  ? validators.defined("required")
                  : undefined,
            }),
          },
          {
            onSubmit,
          }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      // no profession selected, so we only see an error about profession being missing
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.fieldProps("profession").issues).toEqual([
        "required",
      ]);
      expect(result.current.fieldProps("industry").issues).toEqual(undefined);

      // select 'employee' as profession and try to submit
      await act(async () => {
        await result.current.fieldProps("profession").onChange("employee");
        await result.current.handleSubmit();
      });

      // now industry should show an error, since it's required when profession is 'employee'
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.fieldProps("industry").issues).toEqual([
        "required",
      ]);

      // select an industry and submit
      await act(async () => {
        await result.current.fieldProps("industry").onChange("health");
        await result.current.handleSubmit();
      });

      expect(result.current.fieldProps("industry").issues).toEqual(undefined);
      expect(onSubmit).toHaveBeenLastCalledWith({
        profession: "employee",
        industry: "health",
      });

      // change profession to 'student', deselect industry and submit
      await act(async () => {
        await result.current.fieldProps("profession").onChange("student");
        await result.current.fieldProps("industry").onChange(undefined);
        await result.current.handleSubmit();
      });

      // now profession and industry are both ok, and industry is back to an Option (none) in submit
      expect(result.current.fieldProps("profession").issues).toEqual(undefined);
      expect(result.current.fieldProps("industry").issues).toEqual(undefined);
      expect(onSubmit).toHaveBeenLastCalledWith({
        profession: "student",
        industry: undefined,
      });
    });

    test("conditional field validation of many elements of an array field", async () => {
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              apples: subFormValue([
                {
                  type: "",
                  quantity: 1,
                },
              ]),
            },
            fieldValidators: () => ({}),
            subFormValidators: (values, index) => {
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
            onSubmit: () => Promise.resolve(success(null)),
          }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(
        result.current.subForm("apples").items[0].fieldProps("type").issues
      ).toEqual(["required"]);
      expect(
        result.current.subForm("apples").items[0].fieldProps("quantity").issues
      ).toEqual(undefined);

      await act(async () => {
        await result.current.subForm("apples").items[0].onChangeValues({
          type: "Fuji",
          quantity: 1,
        });
      });

      expect(
        result.current.subForm("apples").items[0].fieldProps("type").issues
      ).toEqual(undefined);
      expect(
        result.current.subForm("apples").items[0].fieldProps("quantity").issues
      ).toEqual(["error"]);

      await act(async () => {
        await result.current.subForm("apples").items[0].onChangeValues({
          type: "",
          quantity: 2,
        });
      });

      expect(
        result.current.subForm("apples").items[0].fieldProps("type").issues
      ).toEqual(["required"]);
      expect(
        result.current.subForm("apples").items[0].fieldProps("quantity").issues
      ).toEqual(undefined);
    });

    test("field array validation on removal", async () => {
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              apples: subFormValue([
                {
                  type: "",
                  quantity: 0,
                },
                {
                  type: "Fuji",
                  quantity: 10,
                },
              ]),
            },
            fieldValidators: () => ({}),
            subFormValidators: () => {
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
            onSubmit: () => Promise.resolve(success(null)),
          }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(
        result.current.subForm("apples").items[0].fieldProps("type").issues
      ).toEqual(["required"]);
      expect(
        result.current.subForm("apples").items[0].fieldProps("quantity").issues
      ).toEqual(["error"]);

      expect(
        result.current.subForm("apples").items[1].fieldProps("type").issues
      ).toEqual(undefined);
      expect(
        result.current.subForm("apples").items[1].fieldProps("quantity").issues
      ).toEqual(undefined);

      await act(async () => {
        await result.current.subForm("apples").items[0].remove();
      });

      expect(
        result.current.subForm("apples").items[0].fieldProps("type").value
      ).toEqual("Fuji");
      expect(
        result.current.subForm("apples").items[0].fieldProps("quantity").value
      ).toEqual(10);

      expect(
        result.current.subForm("apples").items[0].fieldProps("type").issues
      ).toEqual(undefined);
      expect(
        result.current.subForm("apples").items[0].fieldProps("quantity").issues
      ).toEqual(undefined);
    });

    test("validateOnChange and validateOnBlur work", async () => {
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              promoCode: "",
            },
            fieldValidators: () => ({
              promoCode: validators.minLength(1, "required"),
            }),
            validateOnBlur: false,
            validateOnChange: false,
          },
          {
            onSubmit: ({ promoCode }) => Promise.resolve(success(promoCode)),
          }
        )
      );

      await act(async () => {
        await result.current.fieldProps("promoCode").onBlur();
      });

      expect(result.current.fieldProps("promoCode").value).toBe("");
      expect(result.current.fieldProps("promoCode").issues).toEqual(undefined);

      await act(async () => {
        await result.current.fieldProps("promoCode").onChange("some value");
      });

      expect(result.current.fieldProps("promoCode").value).toBe("some value");
      expect(result.current.fieldProps("promoCode").issues).toEqual(undefined);

      await act(async () => {
        await result.current.fieldProps("promoCode").onChange("");
      });

      expect(result.current.fieldProps("promoCode").value).toBe("");
      expect(result.current.fieldProps("promoCode").issues).toEqual(undefined);

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.fieldProps("promoCode").value).toBe("");
      expect(result.current.fieldProps("promoCode").issues).toEqual([
        "required",
      ]);
    });

    test("validations of array fields that are not subforms", async () => {
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              users: [] as Array<{ value: string }>,
            },
            fieldValidators: () => ({
              users: validators.fromPredicate(
                (v: Array<{ value: string }>) => v.length > 0,
                "error"
              ),
            }),
          },
          {
            onSubmit: ({ users }) => Promise.resolve(success(users)),
          }
        )
      );

      await act(async () => {
        await result.current.fieldProps("users").onBlur();
      });

      expect(result.current.fieldProps("users").value).toEqual([]);
      expect(result.current.fieldProps("users").issues).toEqual(["error"]);

      await act(async () => {
        await result.current.fieldProps("users").onChange([{ value: "UserA" }]);
      });

      expect(result.current.fieldProps("users").value).toEqual([
        { value: "UserA" },
      ]);
      expect(result.current.fieldProps("users").issues).toEqual(undefined);
    });

    test("push and insertAt work", () => {
      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              users: subFormValue([] as Array<{ value: string }>),
            },
            fieldValidators: () => ({
              users: validators.fromPredicate(
                (v: Array<{ value: string }>) => v.length > 0,
                "error"
              ),
            }),
          },
          {
            onSubmit: ({ users }) => Promise.resolve(success(users)),
          }
        )
      );

      expect(result.current.subForm("users").items.length).toBe(0);

      act(() => {
        result.current.subForm("users").push({ value: "Alice" });
      });

      expect(result.current.subForm("users").items.length).toBe(1);
      expect(
        result.current.subForm("users").items[0].fieldProps("value").value
      ).toEqual("Alice");

      act(() => {
        result.current.subForm("users").insertAt(0, { value: "John" });
      });

      expect(result.current.subForm("users").items.length).toBe(2);
      expect(
        result.current.subForm("users").items[0].fieldProps("value").value
      ).toEqual("John");
      expect(
        result.current.subForm("users").items[1].fieldProps("value").value
      ).toEqual("Alice");

      act(() => {
        result.current.subForm("users").push({ value: "Stella" });
      });

      expect(result.current.subForm("users").items.length).toBe(3);
      expect(
        result.current.subForm("users").items[0].fieldProps("value").value
      ).toEqual("John");
      expect(
        result.current.subForm("users").items[1].fieldProps("value").value
      ).toEqual("Alice");
      expect(
        result.current.subForm("users").items[2].fieldProps("value").value
      ).toEqual("Stella");
    });
  });

  describe("form validation", () => {
    test("formErrors are set via onSubmit", async () => {
      const onSubmit = jest.fn((s: string) => Promise.resolve(success(s)));

      const { result } = renderHook(() =>
        useFormo(
          {
            initialValues: {
              username: "wrong",
              password: "wrong",
            },
            fieldValidators: (_) => ({
              username: validators.minLength(1, "required"),
              password: validators.minLength(1, "required"),
            }),
          },
          {
            onSubmit: ({ username, password }) =>
              username === "username" && password === "password"
                ? (() => {
                    onSubmit("token");
                    return Promise.resolve(success(null));
                  })()
                : Promise.resolve(failure(["LoginError"])),
          }
        )
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      // onSubmit must not have been called because formValidator failed
      expect(onSubmit).not.toHaveBeenCalled();
      expect(result.current.formErrors).toEqual(["LoginError"]);

      await act(async () => {
        await result.current.fieldProps("username").onChange("username");
        await result.current.fieldProps("password").onChange("password");
        await result.current.handleSubmit();
      });

      expect(result.current.formErrors).toEqual(undefined);
      expect(onSubmit).toHaveBeenLastCalledWith("token");
    });
  });

  test("formErrors are reset before next onSubmit", async () => {
    const { result } = renderHook(() =>
      useFormo(
        {
          initialValues: {
            username: "username",
          },
          fieldValidators: (_) => ({
            username: validators.validator((u) =>
              u === "invalid" ? failure("InvalidUsername") : success(u)
            ),
          }),
        },
        {
          onSubmit: ({ username }) =>
            username === "username"
              ? Promise.resolve(failure(["FormError"]))
              : Promise.resolve(success(null)),
        }
      )
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.formErrors).toEqual(["FormError"]);

    await act(async () => {
      await result.current.fieldProps("username").onChange("invalid");
      await result.current.handleSubmit();
    });

    // form error should have been reset
    expect(result.current.formErrors).toEqual(undefined);
    expect(result.current.fieldProps("username").issues).toEqual([
      "InvalidUsername",
    ]);
  });
});
