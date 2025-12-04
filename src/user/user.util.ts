import bcrypt from "bcrypt";
import { sign } from "jsonwebtoken";
import { config } from "../config/config";

export const hashPassword = async (password: string) => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (userId: string) => {
  return sign({ sub: userId }, config.jwtSecret as string, {
    expiresIn: "7d",
    algorithm: "HS256",
  });
};
