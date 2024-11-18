import mongoose from "mongoose";
const Schema = mongoose.Schema;
const ObjectId= mongoose.ObjectId;

const Product = new Schema({
    name: {type: String, required: true},
    price: {type: Number, required: true},
    inStock: {type: Boolean, required: true},
    description: {type: String, default: "Not Available"},
    category:{type: String},
    subCategory: {type: String},
    vendorId: ObjectId,
    vendorName: {type: String , required: true},
    image: {type: [String]},
    discount: {
        admin: {
          applied: Boolean,
          disc: Number
        },
        vendor: {
          applied: Boolean,
          disc: Number
        }
      },
    costPrice: {type: Number, required: true},
    weight: {type: Number, required: true},
    delivery :{type: String, required: true}

})

const ProductQuantity = new Schema({
    productId: {type: ObjectId, required: true},
    hasVariant: {type: Boolean},
    variantType: {type: String, default: "Null"},
    quantity: {type: [Object]},
    total: {type: Number }

})

/*
quantity has to be an array of objects which looks like this
[  {type: 'red', quantity: 0} , {type: 'green', quantity: 0}  ] 
*/

const ProductReview = new Schema({
  productId: {type: ObjectId, required : true },
  hasReviews: {type: Boolean, default: false},
  reviews: {type: [Object], default: []}
})

const ProductQuestions = new Schema({
  productId: {type: ObjectId, required: true},
  hasQuestions: {type: Boolean, default: false},
  questions: {type :[Object]}
})

const ProductSales = new Schema ({
  productId: {type: ObjectId, required: true},
  sales: {type: [Object]},
  quantitySold: {type: Number},
  productRevenue: {type: Number}
})

const ProductModel = mongoose.model('products', Product)
const ProductQuantityModel= mongoose.model('product-quantity',ProductQuantity)
const ProductReviewModel = mongoose.model('user-reviews', ProductReview)
const ProductQuestionModel = mongoose.model('product-questions',ProductQuestions)
const ProductSalesModel = mongoose.model('product-sales',ProductSales)

export {ProductModel, ProductQuantityModel, ProductReviewModel, ProductQuestionModel, ProductSalesModel}