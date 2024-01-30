import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getRefreshAccessToken,
  updateUserAvatar,
  updateUserCoverImage,
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

// Secured routes
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(getRefreshAccessToken);
userRouter
  .route("/update-avatar")
  .post(upload.single("avatar"), updateUserAvatar);
userRouter
  .route("/update-cover-image")
  .post(upload.single("coverImage"), updateUserCoverImage);

export default userRouter;
