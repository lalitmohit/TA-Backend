import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // 1. Getting User Details from Frontend
  // 2. Validation - Not Empty / ........
  // 3. Checking if User Exists ? from username, email
  // 4. Checking for images, checking for avatar
  // 5. upload them to cloudinary, avatar
  // 6. Create user object - create entry in DB
  // 7. Remove password and refresh token field from response
  // 8. check for user creation
  // 9. return user response

  const { fullName, email, username, password } = req.body;
  console.log("email", email);

  if (
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All Firlds are Compulsory");
  }
  // if(fullName === ""){
  //   throw new ApiError(400,"Full Name is Required")
  // }

  const existedUser = await User.findOne({
    $and: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with given data already exist");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Some Error while registering a user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registerd Successfully"));
});

export { registerUser };
