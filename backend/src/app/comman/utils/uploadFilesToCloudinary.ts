import cloudinary from "../config/cloudinary.js";

export type UploadedFile = {
  url: string;
  publicId: string;
  resourceType: string;
};

type FileToDelete = { publicId: string; resourceType: string };

const uploadOne = (file: Express.Multer.File) =>
  new Promise<UploadedFile>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "helping-humanity",
        resource_type: "auto",
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
        });
      },
    );

    stream.end(file.buffer);
  });

export const uploadFilesToCloudinary = async (
  files: Express.Multer.File[],
): Promise<UploadedFile[]> => {
  const results = await Promise.allSettled(files.map(uploadOne));

  const uploaded = results
    .filter(
      (r): r is PromiseFulfilledResult<UploadedFile> =>
        r.status === "fulfilled",
    )
    .map((r) => r.value);

  const failed = results.find(
    (r): r is PromiseRejectedResult => r.status === "rejected",
  );

  if (failed) {
    await deleteFilesFromCloudinary(uploaded);
    throw failed.reason;
  }

  return uploaded;
};

export const deleteFilesFromCloudinary = async (files: FileToDelete[]) => {
  if (files.length === 0) return;

  const results = await Promise.allSettled(
    files.map((file) =>
      cloudinary.uploader.destroy(file.publicId, {
        resource_type: file.resourceType,
      }),
    ),
  );

  results.forEach((result, i) => {
    if (result.status === "rejected") {
      console.error(
        `Cloudinary cleanup failed for ${files[i]?.publicId}:`,
        result.reason,
      );
    }
  });
};
