import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { verify, JwtPayload } from "jsonwebtoken";
import { config } from "../config/config";

export interface AuthRequest extends Request {
  userId: string;
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token;

  if (!token) {
    return next(createHttpError(401, "Authorization token is required."));
  }

  try {
    const decoded = verify(token, config.jwtSecret as string) as JwtPayload;

    const _req = req as AuthRequest;
    _req.userId = (decoded.sub as string) || (decoded.id as string);

    next();
  } catch (err) {
    return next(createHttpError(401, "Invalid or expired token."));
  }
};

export default authenticate;
