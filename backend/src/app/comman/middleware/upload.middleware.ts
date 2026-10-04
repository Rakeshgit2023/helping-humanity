import type { Request, Response, NextFunction } from "express";
import multer from "multer";
import ApiError from "../utils/api.error.js";

type MediaType = "image" | "video" | "both";

const mediaLabel: Record<MediaType, string> = {
  image: "image",
  video: "video",
  both: "file",
};

const storage = multer.memoryStorage();

const allowedMimeTypes: Record<MediaType, string[]> = {
  image: ["image/jpeg", "image/png", "image/webp"],

  video: ["video/mp4", "video/mpeg", "video/quicktime", "video/webm"],

  both: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/webm",
  ],
};

export const upload = (
  mediaType: MediaType = "image",
  maxFiles: number = 2,
) => {
  return multer({
    storage,

    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB per file
      files: maxFiles,
    },

    fileFilter: (_req, file, cb) => {
      if (allowedMimeTypes[mediaType].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(ApiError.badRequest(`Only ${mediaType} files are allowed`));
      }
    },
  });
};

export const requireFiles = (
  req: Request,
  mediaType: MediaType = "image",
  minFiles: number = 1,
): string | null => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length < minFiles) {
    const label = mediaLabel[mediaType];
    return `At least ${minFiles} ${label}${minFiles > 1 ? "s" : ""} is required`;
  }

  return null;
};
