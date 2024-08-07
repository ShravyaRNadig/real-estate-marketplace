import "dotenv/config";
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// connect to mongodb
mongoose.connect(process.env.DATABASE)
    .then(() => {
        console.log("DB Connected");
        // routes middleware
        app.use('/', authRoutes);

        app.listen(8000, () => {
            console.log("Server is running in 8000")
        });
    })
    .catch((err) => console.log("DB Connection Error =>", err));

