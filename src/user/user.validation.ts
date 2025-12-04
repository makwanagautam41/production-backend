import createHttpError from "http-errors";

export const validateRegister = (body: any) => {
  const { name, email, password } = body;
  if (!name || !email || !password) {
    throw createHttpError(400, "All fields are required");
  }
};

export const validateLogin = (body: any) => {
  const { email, password } = body;
  if (!email || !password) {
    throw createHttpError(400, "All fields are required");
  }
};
