import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/mondodb.js';
import uploadRoute from './controllers/routeupload.js';
import getProducts from './routes/getProducts.js'
import userSignup from './routes/user/userSignup.js'
import userSignin from './routes/user/userSignin.js'
import userOperations from './routes/user/userOperations.js'
import vendorSignup from './routes/vendor/vendorSignup.js'
import vendorSignin from './routes/vendor/vendorSignin.js'
import vendorOperations from './routes/vendor/vendorOperations.js'
import vendorProfile from './routes/vendor/vendorProfile.js'
import adminOperations from './routes/admin/adminOperations.js'

import multer from 'multer';
dotenv.config();
const upload = multer({ dest: 'uploads/' });
const app = express();

//congif for env variables
const port = process.env.PORT || 4000;

//function to connect to database
connectDB();  


//middlewares
app.use(express.json());
app.use(cors());

//routing
app.use('/',getProducts)
//app.use("/users", uploadRoute);
app.use("/user", userSignup);
app.use("/user", userSignin);
app.use("/user", userOperations);
app.use("/vendor",vendorSignup)
app.use("/vendor",vendorSignin)
app.use("/vendor",vendorOperations)
app.use("/vendor",vendorProfile)
app.use("/admin", adminOperations)




//hosting the server on the port
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
