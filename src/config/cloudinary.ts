import { v2 as cloduinary } from "cloudinary";
import { config } from "./config";

cloduinary.config({
  cloud_name: config.cloudinaryCloud,
  api_key: config.cloudinaryApiKey,
  api_secret: config.cloudinarySecret,
});

export default cloduinary;
