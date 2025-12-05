import { NextFunction, Request, Response } from "express";
import { userService } from "./user.service";
import { validateLogin, validateRegister } from "./user.validation";
import { config } from "../config/config";
import path from "node:path";
import cloudinary from "../config/cloudinary";
import { AuthRequest } from "../middlewares/authenticate";
import fs from "node:fs";
import createHttpError from "http-errors";

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateRegister(req.body);
    const { name, email, password } = req.body;

    const token = await userService.createUser(name, email, password);
    console.log(token);

    res.status(201).json({ token });
  } catch (err) {
    next(err);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateLogin(req.body);
    const { email, password } = req.body;

    const token = await userService.loginUSer(email, password);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: config.env === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ message: "Logged in successfully" });
  } catch (err) {
    next(err);
  }
};

export const updateProfileImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };

  if (!files?.profileImage || files.profileImage.length === 0) {
    return res.status(400).json({ message: "No image uploaded" });
  }

  const image = files.profileImage[0]!;
  const ext = image.mimetype.split("/").pop() as
    | "jpg"
    | "jpeg"
    | "png"
    | "gif"
    | "webp"
    | "tiff";

  const fileName = image.filename;
  const filePath = path.resolve(
    __dirname,
    "../../public/data/uploads",
    fileName
  );

  const _req = req as AuthRequest;

  try {
    const uploadResult = await cloudinary.uploader.upload(filePath, {
      public_id: fileName,
      folder: "prod-backend/user",
      format: ext,
    });

    const updatedUser = await userService.updateProfileImage(
      _req.userId,
      uploadResult.public_id,
      uploadResult.secure_url
    );

    return res.json({
      message: "Profile image updated",
      profileImage: updatedUser?.profileImage,
    });
  } catch (error) {
    console.error("Update image error:", error);
    return next(
      createHttpError(500, "Failed to upload image or update user profile.")
    );
  } finally {
    try {
      await fs.promises.unlink(filePath);
    } catch (cleanupErr) {
      console.warn("Cleanup failed:", cleanupErr);
    }
  }
};
