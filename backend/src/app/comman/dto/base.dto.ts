import z, { ZodObject } from "zod";
import type { ZodRawShape } from "zod"; // ✅ type-only import

class BaseDto<T extends ZodRawShape = ZodRawShape> {
  protected schema: ZodObject<T>;

  constructor(schema: ZodObject<T>) {
    this.schema = schema;
  }

  public async validate(data: unknown) {
    const result = await this.schema.safeParseAsync(data);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      return { errors, value: null };
    }
    return { errors: null, value: result.data };
  }
}

export default BaseDto;
