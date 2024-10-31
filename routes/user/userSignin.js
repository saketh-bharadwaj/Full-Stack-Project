import express from "express";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { UserModel } from "../../models/userModel.js";

const router = express.Router();

router.post('/signin',async function(req, res){
    const email=req.body.email;
    const password=req.body.password;

    const response = await UserModel.findOne({
        email: email
    })
    if(!response){
        res.status(403).json({
            success: false,
            message: "User does not exist"
        })
        return;
    }
    const passwordMatch=await bcrypt.compare(password,response.password);
    if(passwordMatch){
        const token=jwt.sign({
            id: response._id.toString()
        },process.env.JWT_SECRET);
        res.json({
            success: true,
            token: token
        })
    }
    else {
        res.status(403).json({
            success: false,
            message: "Invalid Credentials"
        })
    }
})

export default router;