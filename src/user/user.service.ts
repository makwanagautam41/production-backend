import createHttpError from "http-errors";
import userModel from "./user.model";
import { hashPassword, comparePassword, generateToken } from "./user.util";
import { User } from "./user.types";

export const userService = {
  async createUser(name: string, email: string, password: string) {
    const exist = await userModel.findOne({ email });

    if (exist)
      throw createHttpError(400, "User already exist with this email.");

    const hashed = await hashPassword(password);
    let newUser: User;

    try {
      newUser = await userModel.create({ name, email, password: hashed });
    } catch (err) {
      throw createHttpError(500, "Error while creating user.");
    }

    return generateToken(newUser._id.toString());
  },

  async loginUSer(email: string, password: string) {
    const user = await userModel.findOne({ email });
    if (!user) throw createHttpError(404, "User not found.");

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) throw createHttpError(400, "Email or password are incorrect");

    return generateToken(user._id.toString());
  },
};
