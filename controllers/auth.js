import { sendLoginEmail } from "../helpers/email.js"
import validator from "email-validator";
import User from "../models/user.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

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
        const user = await User.findOne({ email });
        if (!user) {
            try {
                await sendLoginEmail(email);
                const createdUser = await User.create({
                    email,
                    password: await hashPassword(password),
                    username: nanoid(6)
                });
                const token = jwt.sign(
                    { _id: createdUser._id },
                    process.env.JWT_SECRET,
                    { expiresIn: '2d' }
                );

                createdUser.password = undefined;
                res.json({
                    token,
                    user: createdUser
                });
            }
            catch (err) {
                console.log(err)
                return res.json({ error: "Invalid Email. Please use a valid email address" });
            }
        } else {
            // compare pwd then login
            const match = await comparePassword(password, user.password);
            if (!match) {
                return res.json({
                    error: "Wrong password",
                });
            } else {
                const token = jwt.sign(
                    { _id: user._id },
                    process.env.JWT_SECRET,
                    { expiresIn: '2d' }
                );

                createdUser.password = undefined;
                res.json({
                    token,
                    user: createdUser
                });
            }
        }
    }
    catch (err) {
        console.log("Login error", err);
        res.json({
            error: "Something went wrong. Try again",
        });
    }

    // Welcome email
    // try {
    //     await sendLoginEmail(email);
    //     res.status(200).send('Welcome mail sent successful. Please check your email for confirmation.');
    // } catch (error) {
    //     res.status(500).send('There was an error sending the email.');
    // }
}