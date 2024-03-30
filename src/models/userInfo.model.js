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
      lowercase: true,
      trim: true
    },
    department: {
      type: String,
      lowercase: true,
      trim: true
    },
    experience: [
      {
        from: {
          type: Date,
          trim: true
        },
        to: {
          type: Date,
          trim: true
        },
        companyName: {
          type: String,
          lowercase: true,
          trim: true
        },
        industry: {
          type: String,
          lowercase: true,
          trim: true
        },
        designation: {
          type: String,
          lowercase: true,
          trim: true
        }
      }
    ],
    profileSummary: {
      type: String,
      lowercase: true,
      trim: true
    },
    areaOfSpecilisation: [
      {
        type: String,
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
      lowercase: true,
      trim: true
    }],
    secondarySkills: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    softwareTools: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    hardwareTools: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    publications: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    patents: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      // required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
  }
);


export const UserInfo = mongoose.model("Userinfo", userInfo);
