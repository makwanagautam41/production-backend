import express from "express";
import { userControllers } from "./user.controller";
import multer from "multer";
import path from "node:path";
import authenticate from "../middlewares/authenticate";

const userRouter = express.Router();

const upload = multer({
  dest: path.resolve(__dirname, "../../public/data/uploads"),
  limits: { fileSize: 3e7 },
});

// routes
userRouter.post("/register", userControllers.createUser);
userRouter.post("/login", userControllers.loginUser);
userRouter.post(
  "/update-profile-image",
  authenticate,
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  userControllers.updateProfileImage
);
userRouter.get("/me", authenticate, userControllers.mydetails);

export default userRouter;
