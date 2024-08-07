import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get('/api', (req, res) => {//1st parameter route 2nd callback function
    res.send(`The current time is ${new Date().toLocaleTimeString()}`);
}) 

app.listen(8000,()=>{
    console.log("Server is running in 8000")
});
