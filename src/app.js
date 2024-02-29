import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

// Enable CORS with the specified origin and credentials
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Parse incoming requests with JSON payloads
app.use(express.json({ limit: "16kb" }));

// Parse incoming requests with URL-encoded payloads
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Serve static files from the "public" directory
app.use(express.static("public"));

app.use(cookieParser());

// routes import
import userRouter from "./routes/user.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);

export { app };
