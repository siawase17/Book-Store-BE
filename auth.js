const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const ensureAuth = (req, res) => {
    try {
        const token = req.headers["authorization"];
        if (token) {
            return jwt.verify(token, process.env.PRIVATE_KEY)
        } else {
            throw new ReferenceError ("jwt must be provided");
        };
    } catch (err) {
        console.log(err);
        return err;
    }
};

module.exports = ensureAuth;