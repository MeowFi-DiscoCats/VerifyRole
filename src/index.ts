import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorMiddleware } from "./utils/errorMiddleware";

dotenv.config();

import routes from "./routes";

const app: Application = express();
const port = process.env.PORT || 8000;
app.use(cors({ origin: "*", optionsSuccessStatus: 200 }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

import "./setup/passport";
import "./setup/mongoose";
import "./setup/discord";

app.use("/", routes);
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port} `);
});
