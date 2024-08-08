import { sendWelcomeEmail, sendPasswordResetEmail } from "../helpers/email.js"
import validator from "email-validator";
import User from "../models/user.js";
import { hashPassword, comparePassword } from "../helpers/auth.js";
import { nanoid } from "nanoid";
import jwt from "jsonwebtoken";

export const api = (req, res) => {
    res.send(`The current time is ${new Date().toLocaleDateString()}`);
};

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
        // Check if the user exists
        const user = await User.findOne({ email });
    
        if (!user) {
            // If the user does not exist, create a new user
            try {
                await sendWelcomeEmail(email);
                const createdUser = await User.create({
                    email,
                    password: await hashPassword(password),
                    username: nanoid(6)
                });
    
                // Create a JWT token for the newly created user
                const token = jwt.sign(
                    { _id: createdUser._id },
                    process.env.JWT_SECRET,
                    { expiresIn: '2d' }
                );
    
                createdUser.password = undefined; // Hide the password field
                return res.json({
                    token,
                    user: createdUser
                });
            } catch (err) {
                console.log("Error creating user or sending email:", err);
                return res.json({ error: "Error creating user. Please try again." });
            }
        } else {
            // User exists, validate password
            const match = await comparePassword(password, user.password);
    
            if (!match) {
                return res.json({
                    error: "Incorrect password",
                });
            } else {
                // Create a JWT token for the existing user
                const token = jwt.sign(
                    { _id: user._id },
                    process.env.JWT_SECRET,
                    { expiresIn: '2d' }
                );
    
                user.password = undefined; // Hide the password field
                return res.json({
                    token,
                    user
                });
            }
        }
    } catch (err) {
        console.log("Login error:", err);
        res.json({
            error: "Something went wrong. Please try again.",
        });
    }
    

    // Welcome email
    // try {
    //     await sendWelcomeEmail(email);
    //     res.status(200).send('Welcome mail sent successful. Please check your email for confirmation.');
    // } catch (error) {
    //     res.status(500).send('There was an error sending the email.');
    // }
};

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        let user = await User.findOne({ email });
        if (!user) {
            return res.json({
                error:
                    "If we find you're account, you will recive an email from us shortly",
            });
        } else {
            const password = nanoid(6);
            user.password = await hashPassword(password);
            await user.save();

            // send email
            try {
                await sendPasswordResetEmail(email, userName, password);
                return res.json({
                    message: "Password reset link has been sent to email",
                });
            } catch (err) {
                console.log("Error sendimg password reset email => ", err);
                res.json({
                    error: "If we find you're account, you will recive an email from us shortly"
                });
            }
        }

    } catch (err) {
        console.log("Forgot password error", err);
        res.json({
            error: "Something went wrong. Try again."
        });
    }
};