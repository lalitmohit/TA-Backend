import { Router } from "express";
import {
  logOutUser,
  loginUser,
  refreshAccessToken,
  registerUser,
  getUserFormStatus,
  getUserInfo,
  updateIndustryInfo,
  getUserInfoDetails,
  updateProfessionalInfo,
  updatePersonalInfo,
  ml_output
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

router.route("/Professional_Info").post(upload.none(), updateProfessionalInfo);
router.route("/Industrial_Info").post(upload.none(), updateIndustryInfo);

router
  .route("/Professional_Info_status")
  .get(upload.none(), getUserInfoDetails);

// Secured Routes
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update").post(upload.none(), updateProfessionalInfo);
router.route("/auth/google").get(upload.none(), authGoogle);
router.route("/auth/google/callback").get(upload.none(), authGoogleCallback);

router.route("/form/status").get(upload.none(), getUserFormStatus);
router.route("/info").get(upload.none(), getUserInfo);
router.route("/personal_info").put(upload.none(), updatePersonalInfo);
router.route("/ml_output").get(upload.none(), ml_output);
export default router;
