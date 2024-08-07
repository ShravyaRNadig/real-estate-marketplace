export const api = (req, res) => {
    res.send(`The current time is ${new Date().toLocaleDateString()}`);
}

export const login = (req, res) => { // email,password
    res.json({ ...req.body, message: "Login Success" })
}