import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import axios from "axios";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating Aceess and Refresh tokens "
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // LOGIC
  // 1. Getting User Details from Frontend
  // 2. Validation - Not Empty / ........
  // 3. Checking if User Exists ? from username, email
  // 4. Checking for images, checking for avatar
  // 5. upload them to cloudinary, avatar
  // 6. Create user object - create entry in DB
  // 7. Remove password and refresh token field from response
  // 8. check for user creation
  // 9. return user response
  console.log(req.body);
  const { firstName, lastName, idNumber, email, password, phone } = req.body;
  console.log("password", password);

  if (
    [firstName, lastName, idNumber, email, password, phone].some(
      (field) => field ?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All Fields are Compulsory");
  }

  if (phone.length > 10) {
    throw new ApiError(400, "Enter Valid Phone Number");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { idNumber }, { phone }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with given data already exist");
  }

  // const avatarLocalPath = req.files?.avatar[0]?.path;

  // if (!avatarLocalPath) {
  //   throw new ApiError(400, "Avatar file is required");
  // }

  // const avatar = await uploadOnCloudinary(avatarLocalPath);

  // if (!avatar) {
  //   throw new ApiError(400, "Avatar file is required");
  // }

  // avatar: avatar.url,
  const user = await User.create({
    firstName: firstName.toLowerCase(),
    lastName: lastName.toLowerCase(),
    idNumber: idNumber,
    password: password,
    email: email.toLowerCase(),
    phone: phone,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Some Error while registering a user");
  }

  const data = {
    idNumber: idNumber,
    password: password
  }

  const resp = await axios.post("http://localhost:8000/api/v1/users/login", data);
  console.log(resp);
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registerd Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // 1. req body -> data
  // 2. username or email
  // 3. find the user
  // 4. password check
  // 5. access an refresh token
  // 6. send secure cookies
  console.log(req.body)
  const { idNumber, password } = req.body;

  if (!(idNumber)) {
    throw new ApiError(400, "idNumber is required");
  }

  const user = await User.findOne({
    $or: [{ idNumber }],
  });

  if (!user) {
    throw new ApiError(404, "User not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid User Credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loginedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

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
          user: loginedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In Successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken ?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user ?.refreshToken) {
      throw new ApiError(401, "Refresh Token is Exipred or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accesToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access Token Refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error ?.message || "Invalid refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user ?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old Paassword");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file ?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avata file Path Missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading On Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user ?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateUserAvatar,
};
