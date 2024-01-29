import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// verifies if user is there or not
export const verifyJWT = asyncHandler(async (req, res, next, err) => {
  try {
    // Get token from req.cookies,(remember app.use(cookies())), through cookies get access token from web app, if not found, in other devices it found from header.authoriation and remove 'bearer '
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    // If there is no token, throw error.
    if (!token) {
      throw new ApiError(401, "Unauthorized request!");
    }
    // Verify the recieved token
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Get the _id from token & deselect -password & -refresh token
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    // If user don't exist
    if (!user) {
      throw new ApiError(401, "Invalid Access Token!");
    }

    // Create property of req.user and give its access of user
    req.user = user;

    // Go for next operation
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
