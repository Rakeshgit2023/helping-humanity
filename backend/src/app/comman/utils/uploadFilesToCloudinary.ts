import cloudinary from "../config/cloudinary.js";

export const uploadFilesToCloudinary = async (files: Express.Multer.File[]) => {
  return Promise.all(
    files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "helping-humanity",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) {
                reject(error);
                return;
              }

              resolve({
                url: result!.secure_url,
                publicId: result!.public_id,
                resourceType: result!.resource_type,
              });
            },
          );

          stream.end(file.buffer);
        }),
    ),
  );
};
