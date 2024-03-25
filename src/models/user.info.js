import mongoose, { Schema } from "mongoose";

const userInfo = new Schema(
  {
    idNumber: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    designation: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    department: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    experience: [
      {
        from: {
          type: Date,
          required: true,
          trim: true
        },
        to: {
          type: Date,
          required: true,
          trim: true
        },
        companyName: {
          type: String,
          required: true,
          lowercase: true,
          trim: true
        },
        industry: {
          type: String,
          required: true,
          lowercase: true,
          trim: true
        },
        designation: {
          type: String,
          required: true,
          lowercase: true,
          trim: true
        }
      }
    ],
    profileSummary: {
      type: Text,
      lowercase: true,
      trim: true
    },
    areaOfSpecilisation: [
      {
        type: String,
        required: true,
        lowercase: true,
        trim: true
      }
    ],
    primaryProgrammingSkills: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    secondaryProgrammingSkills: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    primarySkills: [{
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }],
    secondarySkills: [{
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }],
    softwareTools: [{
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }],
    hardwareTools: [{
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }],
    publications: [{
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }],
    patents: [{
      type: String,
      required: true,
      lowercase: true,
      trim: true
    }],
    collegeId: {
      type: ObjectId,
      ref: "User",
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    isUserInfoSaved: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);


export const UserInfo = mongoose.model("Userinfo", userInfo);
