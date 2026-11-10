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

export const allowedMimeTypes: Record<MediaType, string[]> = {
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
  allowJsonFields: boolean = false,
) => {
  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: allowJsonFields ? maxFiles + 1 : maxFiles,
    },
    fileFilter: (_req, file, cb) => {
      if (
        allowJsonFields &&
        file.fieldname !== "files" &&
        file.mimetype === "application/json"
      ) {
        return cb(null, true);
      }

      if (allowedMimeTypes[mediaType].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(ApiError.badRequest(`Only ${mediaType} files are allowed`));
      }
    },
  });
};

export const normalizeMultipart = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const all = (req.files as Express.Multer.File[] | undefined) ?? [];

  for (const f of all) {
    if (f.fieldname !== "files" && f.mimetype === "application/json") {
      req.body[f.fieldname] = f.buffer.toString("utf8");
    }
  }

  const photos = all.filter((f) => f.fieldname === "files");

  if (photos.length > 2) {
    return res.status(400).json({ message: "You can upload at most 2 images" });
  }

  req.files = photos;
  next();
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
