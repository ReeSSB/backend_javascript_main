import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// Generate Access Token & Refresh Token
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token in database.
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access & refresh token"
    );
  }
};

// API END POINT for REGISTER
// ******************** REGISTER CONTROLLER ********************
const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exist: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  //create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res
  //if you are getting data from form or json body, you can access it through req.body

  // Get data from request body
  // console.log("Req body:", req.body);
  const { userName, fullName, email, password } = req.body;
  // console.log(userName, fullName, email, password);

  // Checking for all field details, if they are empty or not as a validation
  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are compulsory");
  }

  // checking if user exist in database, using email or userName.
  const existedUser = await User.findOne({
    $or: [{ email }, { userName }],
  });
  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // get the images file disk storage path using multer.
  // console.log("request files from multer:", req.files);
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path; //This line is throwing error.

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    // Since coverImage  is optional, it is still required to check if it's available or not.
    coverImageLocalPath = req.files.coverImage[0];
  }
  if (!avatarLocalPath) {
    // Check if avatar image file path is available or not as it is required.
    throw new ApiError(400, "Avatar image is required.");
  }
  // Upload on cloudinary using local path.
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    // Again check if avatar image is available or not. It is necessary for database
    throw new ApiError(400, "Avatar image is required.");
  }

  const user = await User.create({
    userName: userName.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "", //It is optional, if not available let it be empty right now.
  });

  //From response password & refesh token removed.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    // If user is not saved in database.
    throw new ApiError(500, "Somthing went wrong while registering a user.");
  }

  // Send API Response. If All goes well.
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

// ******************** LOGIN CONTROLLER ********************
// API END POINT for LOGIN
const loginUser = asyncHandler(async (req, res) => {
  // req body => data
  // username or email
  // find the user
  // password check
  // access token and refresh token
  // send cookies

  const { userName, email, password } = req.body;

  // Check if both username and email is available
  // if (!userName && !email) {
  //   throw new ApiError(400, "Username or email is required.");
  // }

  // Check if userName or email entered.
  if (!(userName || email)) {
    throw new ApiError(400, "Username or email is required");
  }
  // Check if password entered.
  if (!password) {
    throw new ApiError(400, "Password is required.");
  }

  // Check if user exist.
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  // Throw error if user dont exist.
  if (!user) {
    throw new ApiError(404, "User does not exist! Please register.");
  }

  // Validate Password
  const isPasswordValid = await user.isPasswordCorrect(password);

  // If password is wrong, throw error
  if (!isPasswordValid) {
    throw new ApiError(401, "Wrong password entered.");
  }

  // Get Access Token & Refresh Token
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  // Find user and help to login & deselect password & refresh token.
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // send cookies property as options
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in Successfully!"
      )
    );
});

// ******************** LOGOUT CONTROLLER ********************
// API END POINT for LOGOUT
// Log out user, here, you can access req.user from middle passed before lo
const logoutUser = asyncHandler(async (req, res, next) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        refeshToken: undefined,
      },
    },
    {
      // If new equal true, then after updating it return new object.
      new: true,
    }
  );

  // Send cookie options.
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out!"));
});

// ******************** GET REFRESH ACCESS TOKEN API ********************
// It's an API END POINT - It  helps to get refresh token from user and match it with database , after access token get expire and get a new access token.

const getRefreshAccessToken = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  // If we don't recieve any refesh token.
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized access.");
  }

  // Put all functions in try and catch block
  try {
    // Decode recieved token from user to get some data.
    // Note : refesh token has _id of user.
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Let's find user by using _id recieved from token and get user details
    const user = await User.findById(decodedToken?._id).select("-password");

    // If user is not found throw error.
    if (!user) {
      throw new ApiError(401, "Invalid refresh token.");
    }

    // if received token and refresh token don't match throw error.
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token expired or used.");
    }

    // Send cookie options
    const options = {
      httpOnly: true,
      secure: true,
    };

    // Destructure and get access to accessToken and refreshToken
    // Here we have changes variable name to newRefreshToken (using alias) as because, with same name we are recieving refreshToken from database also.
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // send response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, newRefreshToken },
          "Access token refresh."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token.");
  }
});

// ******************** CHANGE PASSWORD API ********************

const changeCurrentPassword = asyncHandler(async (req, res, next) => {
  // Get all details from request body
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Match new password and confirm password
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Password did not match.");
  }

  // Find user by Id using req.user.id.
  const user = await User.findById(req.user?._id);

  // Compare password using method assigned on user
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  // If password is wrong.
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password.");
  }

  // If old password is correct, set new password in database. And preSave function for pasword will run and hash the password before saving it.
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  // response sent.
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully."));
});

// ******************** FETCH CURRENT USER API ********************
const getCurrentUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user?._id).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user data fetched successfully"));
});

// ******************** UPDATE ACCOUNT DETAILS OF USER API ********************
// Update account details API.
const updateAccountDetails = asyncHandler(async (req, res, next) => {
  const { fullName, email } = req.body;

  // check if all details are provided or not.
  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required.");
  }

  // Find user and update
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    // If new equal true, then after updating it return new object
    { new: true }
  ).select("-password");

  // Send response.
  res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully!"));
});

//  ******************** UPLOAD AVATAR IMAGE OF USER API ********************

const updateUserAvatar = asyncHandler(async (req, res, next) => {
  // Provide local path, because we are using multer middleware directly, we can use req.file
  const avatarLocalPath = req.file?.path;

  // If avatar local path is not available
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing.");
  }

  try {
    // Upload Avatar image on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    // If avatar uploaded url not recieved throw error.
    if (!avatar.url) {
      throw new ApiError(500, "Error while uploading avatar.");
    }

    // Now, update avatar url in database by find id from databse using req.user?._id
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { avatar: avatar.url } },
      // If new equal true, then after updating it return new object
      { new: true }
    ).select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar image uploaded successfully."));
  } catch (error) {
    throw new ApiError(500, error?.message || "Error while uploading avatar.");
  }
});

//  ******************** UPLOAD COVER IMAGE OF USER API ********************

const updateUserCoverImage = asyncHandler(async (req, res, next) => {
  // We need to use middleware multer to fetch file from request url
  const coverImageLocalPath = req.file?.path;

  //If cover image url not found
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image file not found.");
  }

  try {
    // Upload cover image on cloudinary and recieve object which contain 'url'
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // Throw error if no url recieved
    if (!coverImage.url) {
      throw new ApiError(500, "Error while uploading cover image.");
    }

    // Find the data in database using User by quering through req.user?._id & update cover image url.
    const user = await User.findByIdAndUpdate(
      req.user?._id,
      { $set: { coverImage: coverImage.url } },
      // If new equal true, then after updating it return new object
      { new: true }
    ).select("-password");

    // Return response
    return res
      .status(200)
      .json(
        new ApiResponse(200, user, "Cover image uploaded ed successfully.")
      );
  } catch (error) {
    throw new ApiError(
      500,
      error?.message || "Error while uploading cover image."
    );
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getRefreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
};
