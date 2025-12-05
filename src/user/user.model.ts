import mongoose from "mongoose";
import { User } from "./user.types";

const userSchema = new mongoose.Schema<User>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      public_id: {
        type: String,
        required: false,
        default: null,
      },
      secure_url: {
        type: String,
        required: false,
        default:
          "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model<User>("User", userSchema);
