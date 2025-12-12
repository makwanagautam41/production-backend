import { userService } from "../../src/user/user.service";
import userModel from "../../src/user/user.model";
import * as userUtil from "../../src/user/user.util";

jest.mock("../../src/user/user.model");
jest.mock("../../src/user/user.util");

describe("User Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // CREATE USER
  it("createUser → should create a new user and return token", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValue(null);
    (userUtil.hashPassword as jest.Mock).mockResolvedValue("hashed123");
    (userModel.create as jest.Mock).mockResolvedValue({ _id: "123" });
    (userUtil.generateToken as jest.Mock).mockReturnValue("jwt-create-token");

    const token = await userService.createUser(
      "Gautam",
      "test@example.com",
      "pass123"
    );

    expect(token).toBe("jwt-create-token");
    expect(userModel.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });
    expect(userModel.create).toHaveBeenCalled();
    expect(userUtil.generateToken).toHaveBeenCalled();
  });

  it("createUser → should throw error if user already exists", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValue({
      email: "already@ex.com",
    });

    await expect(
      userService.createUser("Gautam", "already@ex.com", "pass123")
    ).rejects.toThrow("User already exist with this email.");
  });

  // LOGIN USER
  it("loginUser → should return JWT token when creadentials are valid", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValue({
      _id: "123",
      password: "hashedpass",
    });

    (userUtil.comparePassword as jest.Mock).mockResolvedValue(true);
    (userUtil.generateToken as jest.Mock).mockReturnValue("jwt-login-token");

    const token = await userService.loginUSer(
      "test@example.com",
      "password123"
    );

    expect(token).toBe("jwt-login-token");
    expect(userModel.findOne).toHaveBeenCalledWith({
      email: "test@example.com",
    });
  });

  it("loginUser → should throw 404 when user does not exist", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValue(null);

    await expect(
      userService.loginUSer("notfound@example.com", "pass123")
    ).rejects.toThrow("User not found.");
  });

  it("loginUser → should throw 400 when password is incorrect", async () => {
    (userModel.findOne as jest.Mock).mockResolvedValue({
      _id: "123",
      password: "hashedpass",
    });

    (userUtil.comparePassword as jest.Mock).mockResolvedValue(false);

    await expect(
      userService.loginUSer("test@example.com", "wrongpass")
    ).rejects.toThrow("Email or password are incorrect");
  });
});
