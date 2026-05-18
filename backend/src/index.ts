import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mainRouter from "./routers";
import { errorHandler } from "./middlewares/error_handler";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.ALLOW_ORIGIN!],
    credentials: true,
  })
);

app.use("", mainRouter);

// Must be registered last — catches any error passed to next(err)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
