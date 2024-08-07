import { sendLoginEmail } from "../helpers/email.js"
export const api = (req, res) => {
    res.send(`The current time is ${new Date().toLocaleDateString()}`);
}

export const login = async (req, res) => {
    res.json({ ...req.body, message: "Login Success" })
    const { email, password } = req.body;
    try {
        await sendLoginEmail(email);
        res.status(200).send('Welcome mail sent successful. Please check your email for confirmation.');
    } catch (error) {
        res.status(500).send('There was an error sending the email.');
    }
}