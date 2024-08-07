import "dotenv/config";
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';

const app = express();

// connect to mongodb
mongoose.connect(process.env.DATABASE)
.then(()=>console.log("DB Connected"))
.catch((err)=>console.log("DB Connection Error =>",err));

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// routes middleware

app.use('/api',authRoutes);

app.get('/api', (req, res) => {//1st parameter route 2nd callback function
    res.send(`The current time is ${new Date().toLocaleDateString()}`);
}) 

app.listen(8000,()=>{
    console.log("Server is running in 8000")
});
