import mongoose from "mongoose";
const ObjectId= mongoose.ObjectId;
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
    orderId: {type: String, required: true},
    custId: {type: ObjectId, required: true},
    custName: {type: String},
    custPic: {type: String},
    orderAt: {type: Number},
    orderDateTime: {type: String},
    orderItems: {type: [Object]},
    orderValue: {type: Number},
    orderRevenue: {type: Number},
    orderProfit: {type: Number}
})

const adminInfoSchema = new Schema({
    email: {type: String, required: true},
    password: {type: String, required: true},
    name: {type: String},
    image: {type: String}
})

const OrderModel = mongoose.model('orders', OrderSchema)
const adminInfoModel = mongoose.model('admin-details', adminInfoSchema)

export {OrderModel, adminInfoModel}