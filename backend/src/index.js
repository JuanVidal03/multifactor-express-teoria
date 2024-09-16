import express from "express";
import cors from "cors";
import { config } from "dotenv";

config();
const PORT = process.env.PORT;
const app = express();
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5713"],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

import authRouter from "./routes/auth.routes.js";
app.use("/api", authRouter);

app.listen(PORT, console.log(`server running on port http://localhost:${PORT}`));
