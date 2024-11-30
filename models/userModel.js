import mongoose from "mongoose";
const ObjectId= mongoose.ObjectId;
const Schema = mongoose.Schema;

const User = new Schema({
    email: {type: String, unique: true, require: true},
    password: {type: String, require: true}
})

const UserInfo = new Schema({
    userId: ObjectId,
    name: {type: String, require: true},
    address: {type: [Object], require: true},
    dateofbirth: {type: String, reuiqre: true},
    phoneNo: {type:String},
    image: {type: [String], default: ["https://res.cloudinary.com/dkngwqe98/image/upload/v1728192792/default-user-pic_w0patr.jpg"]}
})

//may be this is wrong, has to be removed later
const UserCart = new Schema({
    userId: {type: ObjectId, required: true},
    hasItems: {type: Boolean, default: false},
    items: {type: [Object]},
    beforeDiscount: {type: Number, default: 0},
    afterDiscount: {type: Number, default: 0},
    totalShipping: {type: Number, default: 0},
    grandtotal: {type: Number, default: 0},
    addId: {type: String, required: true},
    address: {type: String},
    pincode: {type: String}
})


const Cart = new Schema({
    userId: {type: ObjectId, required: true},
    hasItems: {type: Boolean, default: false},
    items: {type: [Object]},
    beforeDiscount: {type: Number, default: 0},
    afterDiscount: {type: Number, default: 0},
    totalShipping: {type: Number, default: 0},
    grandtotal: {type: Number, default: 0},
    addId: {type: String, required: true},
    address: {type: String},
    pincode: {type: String}
})

const User_Order_history = new Schema ({
    userID: {type: ObjectId, required: true},
    orderHistory : {type: [Object]}
})


const UserModel= mongoose.model('users',User);
const UserInfoModel = mongoose.model('user-info',UserInfo)
const UserCartModel = mongoose.model('usercart',UserCart)
const CartModel = mongoose.model('cart', Cart)
const UserOrderHistoryModel = mongoose.model('user-orders', User_Order_history)

export { UserModel, UserInfoModel, UserCartModel, CartModel, UserOrderHistoryModel};
 