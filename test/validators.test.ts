import { failure, isFailure, isSuccess, success } from "../src/Result";
import { validators } from "../src/validators";

describe("validators", () => {
  describe("inSequence", () => {
    test("it should succeed", async () => {
      const result = await validators.inSequence(
        validators.validator((a: string) => success(a)),
        validators.validator((b: string) => success(b))
      )("foo");

      expect(isSuccess(result)).toBeTruthy();
    });

    test("it should fail", async () => {
      const successValidator = validators.validator((a: string) => success(a));
      const failValidator = validators.validator((b: string) => failure(b));

      const result1 = await validators.inSequence(
        successValidator,
        failValidator
      )("foo");

      expect(isFailure(result1)).toBeTruthy();

      const result2 = await validators.inSequence(
        failValidator,
        successValidator
      )("foo");

      expect(isFailure(result2)).toBeTruthy();
    });

    test("it should pass the validator output to the subsequent validator", async () => {
      const validator1 = validators.validator((a: string) => success(a.length));
      const validation = jest.fn((b: number) => success(b));
      const validator2 = validators.validator(validation)

      await validators.inSequence(validator1, validator2)("foo");

      expect(validation).toHaveBeenCalledWith(3);
    });
  });
});
