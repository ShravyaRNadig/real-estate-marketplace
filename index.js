import "dotenv/config";
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import adRoutes from "./routes/ad.js";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP 100 request per windowMs
    message: "Too many request from this IP, please try again after 15 minutes",
});
app.use(limiter);

// connect to mongodb
mongoose
    .connect(process.env.DATABASE)
    .then(() => {
        console.log("DB Connected");

        // routes middleware
        app.use('/', authRoutes);
        app.use('/', adRoutes);

        // global error handler middleware
        app.use((err, req, res, next) => {
            console.error(err.stack);
            res.status(500).send("Something went wrong!");
        });

        app.listen(8000, () => {
            console.log("Server is running in 8000")
        });
    })
    .catch((err) => console.log("DB Connection Error =>", err));
