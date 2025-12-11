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

  async updateProfileImage(
    userId: string,
    publicId: string,
    secureUrl: string
  ) {
    try {
      const user = await userModel.findById(userId);
      if (!user) throw createHttpError(404, "User not found.");

      const updatedUser = await userModel.findByIdAndUpdate(
        userId,
        {
          profileImage: {
            public_id: publicId,
            secure_url: secureUrl,
          },
        },
        { new: true }
      );

      if (!updatedUser) {
        throw createHttpError(500, "Failed to update user profile image.");
      }

      return updatedUser;
    } catch (err) {
      console.error("DB Update Error:", err);
      throw createHttpError(
        500,
        "Something went wrong while updating profile."
      );
    }
  },

  async findUserById(userId: string) {
    const user = await userModel.findById(userId);
    if (!user) throw createHttpError(404, "User not found.");

    return user;
  },

  async getAllUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const users = await userModel
      .find({})
      .skip(skip)
      .limit(limit)
      .select("-password");

    const totalUsers = await userModel.countDocuments();
    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users,
      totalUsers,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  },
};
