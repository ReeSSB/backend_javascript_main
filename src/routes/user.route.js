import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getRefreshAccessToken,
  updateUserAvatar,
  updateUserCoverImage,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

// Using Router function from express.
const userRouter = Router();

// User Register route, upload middleware of multer injected here, to access the avatar and cover image and field values are set.
userRouter.route("/register").post(
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "avatar", maxCount: 1 },
  ]),
  registerUser
);
// User Login route
userRouter.route("/login").post(loginUser);

// *******SECURED ROUTES*******
// To logout user
userRouter.route("/logout").post(verifyJWT, logoutUser);

// To get Refresh Token and renew access token.
userRouter.route("/refresh-token").post(getRefreshAccessToken);

// To change password
userRouter.route("/change-password").post(verifyJWT, changeCurrentPassword);

// To get current user
userRouter.route("/current-user").get(verifyJWT, getCurrentUser);

// To update account details
userRouter.route("/update-account").patch(verifyJWT, updateAccountDetails);

// To update Avatar
userRouter
  .route("/update-avatar")
  .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

// To Update cover Image
userRouter
  .route("/update-cover-image")
  .patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);

// To get channel profile
userRouter.route("/channel/:username").get(verifyJWT, getUserChannelProfile);

// To get user watch history
userRouter.route("/watch-history/").get(verifyJWT, getWatchHistory);

export default userRouter;
