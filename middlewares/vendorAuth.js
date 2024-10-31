import jwt from 'jsonwebtoken'

import dotenv from 'dotenv';
dotenv.config();

let jwtSecret=process.env.JWT_SECRET;

function vendorAuth(req, res, next) {
    //console.log("reached here")
    const token = req.headers.token;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Bad Auth - Authorization token missing",
        });
    }

    try {
        const response = jwt.verify(token, jwtSecret);
        req.vendorId = response.id;
        next();
    } catch (err) {
        res.status(403).json({
            success: false,
            message: "Bad Auth - Invalid token or authentication failed",
        });
    }
}




export default vendorAuth;