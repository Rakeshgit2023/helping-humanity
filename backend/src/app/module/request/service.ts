import { withErrorHandling } from "../../comman/middleware/withErrorHandling.js";
import ApiError from "../../comman/utils/api.error.js";
import { uploadFilesToCloudinary } from "../../comman/utils/uploadFilesToCloudinary.js";

export const createRequest = withErrorHandling(
  "Create Request for user",
  async (files: Express.Multer.File[]) => {
    if (!files || files.length === 0) {
      throw new ApiError(400, "At least one file is required");
    }

    const result = await uploadFilesToCloudinary(files);
    return result;
  },
);
