import { commonErrorResponses } from "../../comman/dto/response.dto.js";
import {
  createCategoryResponseSchema,
  createCategorySchema,
} from "../../module/category/dto/createCategory.dto.js";
import {
  searchCategoryResponseSchema,
  searchCategorySchema,
} from "../../module/category/dto/searchCategory.dto.js";
import { registry } from "../registry.js";

registry.registerPath({
  method: "post",
  path: "/category/create",
  tags: ["Category"],
  summary: "Create categories",
  description:
    "Creates one or more categories. A maximum of 10 categories can be created in a single request.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createCategorySchema,
          examples: {
            default: {
              value: {
                categories: [
                  {
                    name: "Animal Rescue",
                  },
                  {
                    name: "Food Donation",
                  },
                  {
                    name: "Blood Donation",
                  },
                ],
              },
            },
          },
        },
      },
    },
  },
  responses: {
    201: {
      description: "Categories created successfully",
      content: {
        "application/json": {
          schema: createCategoryResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/category",
  tags: ["Category"],
  summary: "Search categories",
  description:
    "Searches categories by name and returns matching categories with their active status.",
  request: {
    query: searchCategorySchema,
  },
  responses: {
    200: {
      description: "Categories fetched successfully",
      content: {
        "application/json": {
          schema: searchCategoryResponseSchema,
        },
      },
    },
    ...commonErrorResponses,
  },
});
