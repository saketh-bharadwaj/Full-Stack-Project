import express from 'express';
import bcrypt from 'bcrypt';
import upload from '../../middlewares/multer.js';
import imgupload from '../../controllers/routeupload.js';
import imageUploadToCloudinary from '../../middlewares/uploadMiddleware.cjs';
import { VendorModel, VendorInfoModel } from '../../models/vendorModel.js';

const router = express.Router();

router.post('/signup', upload.array('images'), imageUploadToCloudinary, async function(req, res){
    const { name, address,pincode, telnum, licencenum, email, password } = req.body;
    
    let errorThrown = false;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newVendor = await VendorModel.create({
            email: email,
            password: hashedPassword
        });

        await VendorInfoModel.create({
            name: name,
            address: address,
            pincode: pincode,
            telnum: telnum,
            licencenum: licencenum,
            vendorId: newVendor._id,
            image: req.image_url // Use the image URL uploaded to Cloudinary
        });

    } catch(err) {
        console.log(err);
        res.json({
            success: false,
            message: "Vendor Already exists"
        });
        errorThrown = true;
    }

    if (!errorThrown) {
        res.json({
            success: true,
            message: "Signup successful"
        });
    }
});

export default router;
