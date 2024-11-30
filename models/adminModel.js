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

const OrderModel = mongoose.model('orders', OrderSchema)

export {OrderModel}