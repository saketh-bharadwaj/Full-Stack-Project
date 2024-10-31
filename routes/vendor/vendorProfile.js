import express from 'express'
import vendorAuth from '../../middlewares/vendorAuth.js';
import { VendorInfoModel } from '../../models/vendorModel.js';

const router = express.Router();

router.patch('/update-profile', vendorAuth, async function(req,res){
    const {name, address, licencenum, telnum} = req.body;
    let updatedetails = {};
    if(name!== undefined) updatedetails.name=name;
    if(address!== undefined) updatedetails.address=address;
    if(licencenum!== undefined) updatedetails.licencenum=licencenum;
    if(telnum!== undefined) updatedetails.telnum=telnum;

    try{
        let vendorProfile = await VendorInfoModel.findOneAndUpdate({
            vendorId: req.vendorId
        }, updatedetails, {new: true})

        res.status(200).json({
            success: true,
            message: "Vendor Details Updates Successfully",
            data: vendorProfile
        })
    }catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Unable to update details"
        })
    }

})

export default router;