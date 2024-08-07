import expres from 'express';

const router = expres.Router();

router.post("/login",(req,res) => { // email,password
    res.json({...req.body,message:"Login Success"})
});

export default router;
