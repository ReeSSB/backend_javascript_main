import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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
const loginUser = asyncHandler(async (req, res) => {
  res.status(200).json({ message: "ok" });
});

export { registerUser, loginUser };
