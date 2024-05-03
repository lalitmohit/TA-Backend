import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { UserInfo } from "../models/userInfo.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse, ApiFailureResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import axios from "axios";
import { PythonShell } from 'python-shell';
import path from 'path';

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
  try {
    // 1. Getting User Details from Frontend
    const { firstName, lastName, idNumber, email, password, phone } = req.body;
    // 7. Remove password and refresh token field from response
    // 8. check for user creation
    // 9. return user response

    // 2. Validations
    if (
      [firstName, lastName, idNumber, email, password, phone].some(
        (field) => field?.trim() === ""
      )
    ) {
      return res
        .status(409)
        .send(new ApiFailureResponse(400, "All Fields are Compulsory"));
    }

    if (phone.length !== 10) {
      return res
        .status(400)
        .send(new ApiFailureResponse(400, "Phone Length is not 10"));
    }

    if (idNumber.length !== 8) {
      return res
        .status(400)
        .send(new ApiFailureResponse(400, "IdNumber length is not 8"));
    }

    // 3. Checking if User Exists ? from username, email
    const existedUser = await User.findOne({
      $or: [{ email }, { idNumber }, { phone }],
    });

    if (existedUser) {
      return res
        .status(409)
        .send(new ApiFailureResponse(409, "User already exist"));
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

    // 4. Create user object - create entry in DB

    const registerUser = await User.create({
      firstName: firstName.toLowerCase(),
      lastName: lastName.toLowerCase(),
      idNumber: idNumber,
      password: password,
      email: email.toLowerCase(),
      phone: phone,
    });

    if (!registerUser) {
      return res
        .status(400)
        .send(
          new ApiFailureResponse(
            400,
            "User not registered succesfully, try again after sometimes"
          )
        );
    }

    const data = {
      idNumber: idNumber,
      password: password,
    };

    const resp = await axios.post(
      `https://ta-backend-new.vercel.app/api/v1/users/login`,
      data
    );
    console.log(process.env.NEXT_PUBLIC_BACKEND_URL);
    return res.status(201).json(
      new ApiResponse(
        200,
        {
          user: registerUser,
        },
        "User Registered & Logined Successfully"
      )
    );
  } catch (error) {
    console.log(process.env.NEXT_PUBLIC_BACKEND_URL);
    return res.status(500).json(new ApiError(500, "Internal Server Erorr"));
  }
});

const loginUser = asyncHandler(async (req, res) => {
  // 1. req body -> data
  // 2. username or email
  // 3. find the user
  // 4. password check
  // 5. access an refresh token
  // 6. send secure cookies
  const { idNumber, password } = req.body;

  if (!idNumber || idNumber.length !== 8) {
    return res
      .status(400)
      .send(
        new ApiFailureResponse(400, "IdNumber is required and of length 8")
      );
  }

  const user = await User.findOne({
    $or: [{ idNumber }],
  });

  if (!user) {
    return res.status(404).send(new ApiFailureResponse(404, "User not exist"));
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    return res
      .status(401)
      .send(new ApiFailureResponse(401, "Invalid Credentials"));
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

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
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
    throw new ApiError(401, error?.message || "Invalid refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
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

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avata file Path Missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, "Error while uploading On Avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
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

const getUserFormStatus = asyncHandler(async (req, res) => {
  const idNumber = req.query.idNumber;
  const userFormStatus = await User.findOne({
    idNumber: idNumber,
    isDeleted: false,
  }).select({ idNumber: 1, isUserInfoSaved: 1, _id: 0 });
  return res
    .status(200)
    .json(
      new ApiResponse(200, userFormStatus, "User form status sent successfully")
    );
});

const getUserInfo = asyncHandler(async (req, res) => {
  const idNumber = req.query.idNumber;
  const userInfoData = await User.findOne({
    idNumber: idNumber,
    isDeleted: false,
  }).select({
    firstName: 1,
    lastName: 1,
    email: 1,
    phone: 1,
    idNumber: 1,
    GitHub:1,
    Ph2:1,
    Linkedin:1,
    Portfolio:1,
    Other:1,
    _id: 0,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, userInfoData, "User form status sent successfully")
    );
});

const getUserInfoDetails = asyncHandler(async (req, res) => {
  const idNumber = req.query.idNumber;

  let userInfo = await UserInfo.findOne({ idNumber });

  if (!userInfo) {
    userInfo = await UserInfo.create({ idNumber });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userInfo,
      },
      "User info fetched successfully"
    )
  );
});

const updateProfessionalInfo = asyncHandler(async (req, res) => {
  try {
    const { designation, department, experience, profileSummary,_id } = req.body;
    const idNumber = req.query.idNumber;

    // Finding or creating user info
    let userInfo = await UserInfo.findOneAndUpdate(
      { idNumber },
      { $setOnInsert: { idNumber } },
      { upsert: true, new: true }
    );

    if (!userInfo) {
      return res
        .status(400)
        .json(
          new ApiFailureResponse(400, "User not found, Try Sometimes Later")
        );
    }

    // Updating user info
    userInfo.designation = designation;
    userInfo.department = department;
    userInfo.experience = experience;
    userInfo.profileSummary = profileSummary;
    userInfo.collegeId = _id;

    await userInfo.save({ validateBeforeSave: false });

    return res.status(200).json(
      new ApiResponse(
        200,
        { userInfo }, // Object shorthand
        "User Info updated successfully"
      )
    );
  } catch (error) {
    return res.status(500).json(new ApiError(500, "Internal Server Erorr"));
  }
});

const updateIndustryInfo = asyncHandler(async (req, res) => {
  try {
    // LOGIC
    // 1. Getting User Details from Frontend
    // 2. Validation - Not Empty / ........
    // 6. Create user object - create entry in DB
    // 8. check for user creation
    // 9. return user response
    const idNumber = req.query.idNumber;
    const {
      areaOfSpecialisation,
      primaryProgrammingSkills,
      secondaryProgrammingSkills,
      primarySkills,
      secondarySkills,
      softwareTools,
      hardwareTools,
      publications,
      patents,
      _id,
    } = req.body;

    const userInfo = await UserInfo.findOne({
      $or: [{ idNumber }],
    });

    if (!userInfo) {
      return res
        .status(400)
        .json(
          new ApiFailureResponse(400, "User not found, Try Sometimes Later")
        );
    }

    userInfo.areaOfSpecilisation = areaOfSpecialisation;
    userInfo.primaryProgrammingSkills = primaryProgrammingSkills;
    userInfo.secondaryProgrammingSkills = secondaryProgrammingSkills;
    userInfo.primarySkills = primarySkills;
    userInfo.secondarySkills = secondarySkills;
    userInfo.softwareTools = softwareTools;
    userInfo.hardwareTools = hardwareTools;
    userInfo.publications = publications;
    userInfo.patents = patents;
    userInfo.collegeId = _id;

    await userInfo.save({ validateBeforeSave: false });

    const user = await User.findOne({ idNumber: idNumber });
    user.isUserInfoSaved = true;
    await user.save({ validateBeforeSave: false });

    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          { user: user, userInfo: userInfo },
          "User Industrial Info Saved Successfully"
        )
      );
  } catch (error) {
    return res.send(new ApiError(500, "Internal Server Error"));
  }
});


const updatePersonalInfo = asyncHandler(async (req, res) => {
  try {
    const idNumber = req.query.idNumber;
    const {
      Name,
      Email,
      Ph1,
      Linkedin,
      Ph2,
      GitHub,
      Portfolio,
      Other
    } = req.body;

    const userInfo = await User.findOne({
      $or: [{ idNumber }],
    });

    if (!userInfo) {
      return res
        .status(400)
        .json(
          new ApiFailureResponse(400, "User not found, Try Sometimes Later")
        );
    }

    userInfo.firstName = Name;
    // userInfo.lastName = lastName;
    userInfo.email = Email;
    userInfo.phone = Ph1;
    userInfo.Linkedin = Linkedin;
    userInfo.Ph2 = Ph2;
    userInfo.GitHub = GitHub;
    userInfo.Portfolio = Portfolio;
    userInfo.Other = Other;
    

    await userInfo.save({ validateBeforeSave: false });

    return res
      .status(201)
      .json(
        new ApiResponse(
          200,
          { userInfo },
          "User Personal Info Saved Successfully"
        )
      );
  } catch (error) {
    return res.send(new ApiError(500, "Internal Server Error"));
  }
});

const ml_output = asyncHandler(async (req, res) => {
  // console.log("Hello")
  const inputText = req.query.text;
  const options = {
    mode: 'text',
    pythonOptions:['-u'],
    args:[inputText]
};

  PythonShell.run('predict.py',options).then(result => {
    const prediction = result
    // res.send(`Prediction: ${prediction}`)
       res.send(prediction)
      // if (err) {
      //     console.error(err);
      //     console.log("Giving Error")
      //     res.status(500).send('Error occurred');
      // } else {
      //     const prediction = result[0];
      //     console.log("Giving Prediction");
      //     console.log(result)
      //     console.log(prediction)

      //     res.send(`Prediction: ${prediction}`);
      // }
      // console.log(result)
  });
});

export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateUserAvatar,
  getUserFormStatus,
  getUserInfo,
  updateIndustryInfo,
  getUserInfoDetails,
  updateProfessionalInfo,
  updatePersonalInfo,
  ml_output
};
