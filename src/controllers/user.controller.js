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

// ******************** Get Refresh Access Token API ********************
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
    res
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

export { registerUser, loginUser, logoutUser, getRefreshAccessToken };
