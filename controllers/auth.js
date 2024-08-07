import { sendLoginEmail } from "../helpers/email.js"
import validator from "email-validator";

export const api = (req, res) => {
    res.send(`The current time is ${new Date().toLocaleDateString()}`);
}

export const login = async (req, res) => {
    // res.json({ ...req.body, message: "Login Success" })
    const { email, password } = req.body;
    if (!validator.validate(email)) {
        return res.json({ error: "A Valid email required" });
    }

    if (!email?.trim()) {
        return res.json({ error: "Email is required" });
    }

    if (!password?.trim()) {
        return res.json({ error: "Password is required" });
    }

    if (password?.length < 6) {
        return res.json({ error: "Password must be at least 6 characters long" });
    }

    try {
        // 
    }
    catch (err) {

    }

    // Welcome email
    // try {
    //     await sendLoginEmail(email);
    //     res.status(200).send('Welcome mail sent successful. Please check your email for confirmation.');
    // } catch (error) {
    //     res.status(500).send('There was an error sending the email.');
    // }
}