import { NextFunction, Request, Response } from "express";
import { userService } from "./user.service";
import { validateLogin, validateRegister } from "./user.validation";
import { config } from "../config/config";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
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

const loginUser = async (req: Request, res: Response, next: NextFunction) => {
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

export { createUser, loginUser };
