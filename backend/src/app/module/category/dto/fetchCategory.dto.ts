import z from "zod";

export const fetchCategoriesResponseSchema = z.object({
  message: z.string(),
  data: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      isActive: z.boolean(),
    }),
  ),
});

export type FetchCategoriesResponseInput = z.infer<
  typeof fetchCategoriesResponseSchema
>;
