import { Router } from "express";
import {
  logOutUser,
  loginUser,
  refreshAccessToken,
  registerUser,
  getUserFormStatus,
  getUserInfo,
  professionalInfo,
  IndustryInfo,
  getUserInfoDetails,
  updateUserInfoDetails,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { authGoogle, authGoogleCallback } from "../middlewares/google.auth.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);
router.route("/login").post(upload.none(), loginUser);
router.route("/logout").post(verifyJWT, logOutUser);


router.route("/Professional_Info").post(upload.none(), professionalInfo);
router.route("/Industrial_Info").post(upload.none(), IndustryInfo);

router.route("/Professional_Info_status").get(upload.none(), getUserInfoDetails);

// Secured Routes
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update").post(upload.none(), updateUserInfoDetails);
router.route("/auth/google").get(upload.none(), authGoogle);
router.route("/auth/google/callback").get(upload.none(), authGoogleCallback);

router.route("/form/status").get(upload.none(), getUserFormStatus);
router.route("/info").get(upload.none(), getUserInfo);

export default router;
