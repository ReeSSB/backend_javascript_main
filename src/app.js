import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// It is used to set cors origin address
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// It limits the json size for server.
app.use(
  express.json({
    limit: "21kb",
  })
);

// It is used for url encoding i.e, url can contain space, it should be handled.
app.use(
  express.urlencoded({
    extended: true,
    limit: "21kb",
  })
);

// It is used to access some static files like image or favicon.
app.use(express.static("public"));

// Usage of cookieParser: it is used to read cookies fo web browser and to set cookies in web browser.
// Secure can only be read by server and only server can remove it.
app.use(cookieParser());

//-----------------ROUTES-----------------
// Routes import.
import userRouter from "./routes/user.route.js";

// Routes declaration.
app.use("/api/v1/users", userRouter); //http://locahost:8000/api/v1/users/register
//http://locahost:8000/api/v1/users/login
//http://locahost:8000/api/v1/users/logout

export { app };
