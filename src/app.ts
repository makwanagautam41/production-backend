import express, { Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import globalErrorHandler from "./middlewares/globalErrorHandler";
import userRouter from "./user/user.routes";
import { config } from "./config/config";
import cookieParser from "cookie-parser";

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

const allowedOrigins = [config.clientUrl as string].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : undefined,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(helmet());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api", apiLimiter);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: `this is server root route ➡️ Request handled by PORT: ${process.env.PORT}`,
  });
});

app.use("/api/v1/users", userRouter);

app.use((req, res, next) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as Error & {
    statusCode?: number;
  };
  error.statusCode = 404;
  next(error);
});

app.use(globalErrorHandler);

export default app;
