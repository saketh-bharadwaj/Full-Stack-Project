import express from "express";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { adminInfoModel } from "../../models/adminModel.js";
import { OrderModel } from "../../models/adminModel.js";
import adminAuth from "../../middlewares/adminAuth.js";
import { ProductSalesModel } from "../../models/productModel.js";

const router = express.Router();

router.post('/signin',async function(req, res){
    
    const email=req.body.email;
    const password=req.body.password;
    
    const response = await adminInfoModel.findOne({
        email: email
    })
    
    if(!response){
        res.status(403).json({
            success: false,
            message: "User does not exist"
        })
        return;
    }
   
    if(response.password == password){
        const token=jwt.sign({
            id: response._id.toString()
        },process.env.JWT_SECRET);


        res.status(200).json({
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

router.get('/getAllOrders', adminAuth, async function(req,res){
    try{
        const allOrders = await OrderModel.find();

        res.status(200).json({
            success: true,
            data: allOrders
        })
    }catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Unable to get all orders"

        })
    }
})

router.get('/getProductStatistics', adminAuth, async function (req, res) {
    try{
        const productStatistics = await ProductSalesModel.find({ name: { $exists: true } });

        res.status(200).json({
            success: true,
            data: productStatistics
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Unable to get product statistics"

        })
    }
})

router.post('/updateDeliveryStatus', adminAuth, async function(req,res){
    try{
        const deliverAt = Date.now();
        const date = new Date(deliverAt);
        const deldatetime = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

        
        const {orderId, LineId, vendorId} = req.body
        const vendorSales = await VendorSalesModel.findOne({
            vendorId: vendorId
        })
        const sale = vendorSales.sales.find(s => s.orderId == orderId && s.LineId == LineId);
        const custId = sale.custId;
        if (sale.deliveryStatusCode === 0) {
            sale.deliveryStatusCode = 1;
            sale.deliveryStatus = "Order Accepted";
        } else if (sale.deliveryStatusCode === 1) {
            sale.deliveryStatusCode = 2;
            sale.deliveryStatus = "Order Dispatched";
        } else if (sale.deliveryStatusCode === 2) {
            sale.deliveryStatusCode = 3;
            sale.deliveryStatus = "Out for Delivery";
        } else if (sale.deliveryStatusCode === 3) {
            sale.orderStatusCode = 1;
            sale.orderStatus = "completed"
            sale.isDelivered = true
            sale.deliveryDateTime = deldatetime
            sale.deliveryStatusCode = 4;
            sale.deliveryStatus = "Delivery Successful";
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery status code"
            });
        }
        vendorSales.markModified('sales');
        await vendorSales.save();

        const adminOrder = await OrderModel.findOne({
            orderId: orderId
        })
        let LineIdorder = adminOrder.orderItems.find(l => l.LineId==LineId)

        if (LineIdorder.deliveryStatusCode === 0) {
            LineIdorder.deliveryStatusCode = 1;
            LineIdorder.deliveryStatus = "Order Accepted";
        } else if (LineIdorder.deliveryStatusCode === 1) {
            LineIdorder.deliveryStatusCode = 2;
            LineIdorder.deliveryStatus = "Order Dispatched";
        } else if (LineIdorder.deliveryStatusCode === 2) {
            LineIdorder.deliveryStatusCode = 3;
            LineIdorder.deliveryStatus = "Out for Delivery";
        } else if (LineIdorder.deliveryStatusCode === 3) {
            LineIdorder.orderStatusCode = 1;
            LineIdorder.orderStatus = "completed"
            LineIdorder.isDelivered = true
            LineIdorder.deliveryDateTime = deldatetime
            LineIdorder.deliveryStatusCode = 4;
            LineIdorder.deliveryStatus = "Delivery Successful";
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery status code"
            });
        }
        adminOrder.markModified('orderItems')
        await adminOrder.save();

        const custOrder = await UserOrderHistoryModel.findOne({
            userID: custId
        })
        
        const specificOrder = custOrder.orderHistory.find(order => order.orderId == orderId);
        const specificLineItem = specificOrder.orderItems.find(item => item.LineId == LineId);
        if (specificLineItem.deliveryStatusCode === 0) {
            specificLineItem.deliveryStatusCode = 1;
            specificLineItem.deliveryStatus = "Order Accepted";
        } else if (specificLineItem.deliveryStatusCode === 1) {
            specificLineItem.deliveryStatusCode = 2;
            specificLineItem.deliveryStatus = "Order Dispatched";
        } else if (specificLineItem.deliveryStatusCode === 2) {
            specificLineItem.deliveryStatusCode = 3;
            specificLineItem.deliveryStatus = "Out for Delivery";
        } else if (specificLineItem.deliveryStatusCode === 3) {
            specificLineItem.orderStatusCode = 1;
            specificLineItem.orderStatus = "completed"
            specificLineItem.isDelivered = true
            specificLineItem.deliveryDateTime = deldatetime
            specificLineItem.deliveryStatusCode = 4;
            specificLineItem.deliveryStatus = "Delivery Successful";
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid delivery status code"
            });
        }

        custOrder.markModified('orderHistory');
        await custOrder.save();

        res.status(200).json({
            success: true,
            message: "Status updated Succesfully"
        })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Unable to update status"
        })
    }
})
export default router;