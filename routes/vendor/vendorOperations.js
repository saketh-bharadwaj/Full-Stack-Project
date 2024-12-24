import express from 'express';
import imgupload from '../../controllers/routeupload.js';
import imageUploadToCloudinary from '../../middlewares/uploadMiddleware.cjs';
import upload from '../../middlewares/multer.js';
import vendorAuth from '../../middlewares/vendorAuth.js';
import { ProductModel, ProductQuantityModel, ProductQuestionModel, ProductSalesModel } from '../../models/productModel.js';
import { VendorInfoModel, VendorSalesModel } from '../../models/vendorModel.js';
import { UserOrderHistoryModel } from '../../models/userModel.js';

import { ProductReviewModel } from '../../models/productModel.js';
import mongoose from 'mongoose';
import { OrderModel } from '../../models/adminModel.js';
const ObjectId=mongoose.ObjectId;
const router = express.Router();

let getAllProducts = async (vendorId) =>{
    const products= await ProductModel.find({
        vendorId: vendorId
    })
    const productQuantities = await ProductQuantityModel.find();
    const productsWithQuantities = products.map(product => {
        // Find the corresponding quantity information for this product
        const productQuantity = productQuantities.find(
          (quantity) => quantity.productId.toString() === product._id.toString()
        );
  
        //merge quantity data with original data
        if (productQuantity) {
          return {
            ...product.toObject(),  
            hasVariant: productQuantity.hasVariant,  
            variantType: productQuantity.variantType,  
            quantity: productQuantity.quantity ,
            total:productQuantity.total 
          };
        } else {
          
          return product.toObject();
        }
      });

    return productsWithQuantities

}

router.get('/products', vendorAuth, async function(req,res){
    try{
        const products = await ProductModel.find({ vendorId: req.vendorId });
        const productQuantities = await ProductQuantityModel.find();
        const productsWithQuantities = products.map(product => {
            // Find the corresponding quantity information for this product
            const productQuantity = productQuantities.find(
              (quantity) => quantity.productId.toString() === product._id.toString()
            );
      
            //merge quantity data with original data
            if (productQuantity) {
              return {
                ...product.toObject(),  
                hasVariant: productQuantity.hasVariant,  
                variantType: productQuantity.variantType,  
                quantity: productQuantity.quantity ,
                total:productQuantity.total 
              };
            } else {
              
              return product.toObject();
            }
          });

          res.json({
            success: true,
            data: productsWithQuantities
          });
      
        } catch (error) {
          
          res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving products',
            error: error.message
          });
        }
    
})

router.post('/addproduct',vendorAuth, upload.array('images',5), imageUploadToCloudinary, async function(req, res){
    
    const { name, price, description, category,subCategory, hasVariant, variantType, quantity, costPrice, weight, delivery } = req.body;
    
    

    let errorThrown = false;

    try {
        const vendor = await VendorInfoModel.findOne({ vendorId: req.vendorId });
        

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }
        
       const newProduct= await ProductModel.create({
            name: name,
            price: price,
            inStock: true,
            description: description,
            category: category,
            subCategory: subCategory,
            vendorId: req.vendorId,
            vendorName: vendor.name,
            image: req.image_url,
            discount: {
                admin: {
                  applied: false,
                  disc: 0
                },
                vendor: {
                  applied: false,
                  disc: 0
                }
              },
            costPrice: costPrice,
            weight: weight,
            delivery: delivery
        });
        console.log(quantity)
        
        let parsedQuantity = JSON.parse(quantity)
        if(!Array.isArray(parsedQuantity)){
            parsedQuantity=JSON.parse(quantity)
        }
        let total = parsedQuantity.reduce((sum, item) => {
            return sum + parseInt(item.quantity, 10); // Convert quantity to integer and add to the sum
        }, 0);

        total = parseInt(total)
        await ProductQuantityModel.create({
            productId: newProduct._id,
            hasVariant: hasVariant,
            variantType: variantType,
            quantity: parsedQuantity,
            total: total
        })

        await ProductReviewModel.create({
            productId: newProduct._id,
            hasReviews: false,
            reviews: []
        })

        await ProductQuestionModel.create({
            productId: newProduct._id,
            vendorId: req.vendorId,
            hasQuestions: false,
            questions: []
        })

        await ProductSalesModel.create ({
            productId: newProduct._id,
            sales: [],
            quantitySold: 0,
            productRevenue: 0
        })


        
    } catch (err) {
        console.error("Error while adding product: ", err);
        res.status(500).json({
            success: false,
            message: "Server error"
        });
        errorThrown = true;
    }

    if (!errorThrown) {
       
        let dataofproducts = await getAllProducts(req.vendorId)

        res.status(200).json({
            success: true,
            message: "Product added successfully",
            data: dataofproducts
        });
    }
});


router.delete('/delete-product/:productId', vendorAuth, async function (req,res){
    let errorThrown = false;
    let dataofproducts;
    try{
        await ProductQuantityModel.deleteOne({
            productId: req.params.productId
        })
        await ProductModel.deleteOne({
            _id: req.params.productId,
            vendorId: req.vendorId,
        })
        await ProductReviewModel.deleteOne({
            productId: req.params.productId
        })
        await ProductQuestionModel.deleteOne({
            productId: req.params.productId
        })

        const products= await ProductModel.find({
            vendorId: req.vendorId
        })

        dataofproducts = await getAllProducts(req.vendorId);
        

    }catch(err){
        errorThrown = true;
        res.json({
            success: false,
            message: "Unable to delete this product",
            
        })
    }
    if(!errorThrown){
        res.json({
            success: true, 
            message: "Product removed succesfully",
            data: dataofproducts
        })
    }
})
// use to update only name, description,price and category
router.patch('/update-details/:productId', vendorAuth, async function(req, res){
    const updates = req.body
    const id=req.params.productId
    if(id===undefined){
        res.status(400).json({
            success: false,
            error: "Please provide Product Id"
        })
    }
    try{
        const updatedProduct = await ProductModel.findByIdAndUpdate(id, updates, { new: true });
        if(!updatedProduct){
            res.status(404).json({
                success: false,
                message: "Product Not found"
            })
        }
        let dataofproducts = await getAllProducts(req.vendorId)
        res.json({
            success: true,
            message: 'Product details updated successfully',
            data: dataofproducts
        })

    }
    catch(err){
        res.status(500).json({
            success: false,
            message: "Error updating details"
        })
    }
})

//to update stock
router.patch('/update-stock/:productId', vendorAuth, async function(req,res){
    let updateData = {}
    const {hasVariant, variantType, quantity}= req.body;

    if(!Array.isArray(quantity)){
        quantity=JSON.parse(quantity)
    }

    if(hasVariant!==undefined) updateData.hasVariant= hasVariant;
    if(variantType!==undefined) updateData.variantType= variantType;
    if(quantity!==undefined) updateData.quantity = quantity;

    let total = quantity.reduce((sum, item) => {
        return sum + parseInt(item.quantity, 10); 
    }, 0);

    updateData.total=total;

   
    try{
        const updatedProductQuantity = await ProductQuantityModel.findOneAndUpdate(
            {productId:req.params.productId} , updateData, {new: true}
        );
        let updatedProduct;

        if(total===0){
            let stockData={
                inStock: false
            }
             updatedProduct= await ProductModel.findByIdAndUpdate(req.params.productId, stockData, {new: true})
        }

        else{
                updatedProduct= await ProductModel.findOne({_id: req.params.productId});

                // case where product was outofstock and new stock was added
                if(updatedProduct.inStock===false && total!==0){
                    let changeStock = {
                        inStock: true
                    }
                    updatedProduct = await ProductModel.findByIdAndUpdate(req.params.productId, changeStock, {new: true})
                }
        }
        if (updatedProductQuantity) {
            updatedProduct = {
                ...updatedProduct.toObject(), 
                hasVariant: updatedProductQuantity.hasVariant,
                variantType: updatedProductQuantity.variantType,
                quantity: updatedProductQuantity.quantity,
                total: updatedProductQuantity.total
            };
        }
        let dataofproducts = await getAllProducts(req.vendorId)
        res.json({
            success: true,
            message: 'Product stock updated successfully',
            data: dataofproducts
        })
    }
    catch(err){
        console.log(err);
        res.status(500).json({
            success: false,
            message: "Error updating quantity"
        })
    }
})

router.post('/applyDiscount', vendorAuth, async function(req, res) {
    const discountObj = req.body;
    const keysArray = Object.keys(discountObj);
    const valuesArray = Object.values(discountObj);

    try {
        for (let i = 0; i < keysArray.length; i++) {
            const productId =  new mongoose.Types.ObjectId(keysArray[i]);  // Convert string to ObjectId
            const discountValue = Number(valuesArray[i]);  // Convert discount to a number

            const product = await ProductModel.findOne({ _id: productId, vendorId: req.vendorId });
            if (!product) {
                // Handle the case where the product is not found
                return res.status(404).json({
                    success: false,
                    message: `Product with ID ${keysArray[i]} not found`
                });
            }

            if (discountValue === 0) {
                product.discount.vendor.applied = false;
                product.discount.vendor.disc = 0;
            } else {
                product.discount.vendor.applied = true;
                product.discount.vendor.disc = discountValue;
            }
            
            await product.save();
        }
        const products = await ProductModel.find({ vendorId: req.vendorId });
        const productQuantities = await ProductQuantityModel.find();
        const productsWithQuantities = products.map(product => {
            // Find the corresponding quantity information for this product
            const productQuantity = productQuantities.find(
              (quantity) => quantity.productId.toString() === product._id.toString()
            );
      
            //merge quantity data with original data
            if (productQuantity) {
              return {
                ...product.toObject(),  
                hasVariant: productQuantity.hasVariant,  
                variantType: productQuantity.variantType,  
                quantity: productQuantity.quantity ,
                total:productQuantity.total 
              };
            } else {
              
              return product.toObject();
            }
          });

        res.status(200).json({
            success: true,
            message: "Applied discounts successfully",
            data: productsWithQuantities
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Unable to apply discount",
            error: err.message
        });
    }
});

router.get('/salesData', vendorAuth, async function (req,res){
    try{   
        const vendorId = req.vendorId;

        const sales_data = await VendorSalesModel.findOne({
            vendorId: vendorId
        })

        res.status(200).json({
            success: true,
            data: sales_data
        })


    }catch(e){
        res.status(500).json({
            success: false,
            message: "Unable to fetch sales data"
        })
    }
})

router.get('/productReviews', vendorAuth, async function (req, res) {
    const vendorId = req.vendorId;
    try {
        const vendorProducts = await ProductModel.find({
            vendorId: vendorId
        });
        const productIds = vendorProducts.map(product => product._id);
        const productData = vendorProducts.map(product => ({
            productId: product._id,
            name: product.name,
            image: product.image[0]
        }));

        const productReviews = await Promise.all(
            productData.map(async product => {
                const productReview = await ProductReviewModel.findOne({
                    productId: product.productId
                });
                return productReview || { hasReviews: false, reviews: [] }; // Default values for missing reviews
            })
        );

        productData.forEach((product, index) => {
            const reviewData = productReviews[index];
            product.hasReviews = reviewData.hasReviews;
            product.reviews = reviewData.reviews;
        });

        res.status(200).json({
            success: true,
            data: productData
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "Unable to get review data"
        });
    }
});


router.get('/productQuestions', vendorAuth, async function(req,res){
    const vendorId = req.vendorId
    try{
        const productQuestions = await ProductQuestionModel.find({
            vendorId: vendorId
        })
        const mergedData = await Promise.all(
            productQuestions.map(async (question) => {
                const productDetails = await ProductModel.findOne({ _id: question.productId });
                return {
                    ...question.toObject(), 
                    productName: productDetails?.name || null,
                    productImage: productDetails?.image[0] || null
                };
            })
        );

        res.status(200).json({
            success: true,
            data: mergedData
        })
    }
    catch(e){
        console.log(e);
        res.status(500).json({
            success: false,
            message: "Unable to fetch questions"
        })
    }
})

router.post('/ansQuestion/:productId', vendorAuth, async function (req,res){
    const vendorId = req.vendorId
    try{
        const { quesId, answer } = req.body;
        const vendorInfo = await VendorInfoModel.findOne({
            vendorId: vendorId
        })
        const productques = await ProductQuestionModel.findOne({
            productId: req.params.productId
        });
        if (!productques) {
            return res.status(404).json({
            success: false,
            message: "Product questions not found"
            });
        }
            
        const questionIndex = productques.questions.findIndex(q => q.quesId == quesId);
            
        if (questionIndex === -1) {
        return res.status(404).json({
        success: false,
        message: "Question not found"
        });
        }
            
            
        if (productques.questions[questionIndex].isAnswered === false) {
            productques.questions[questionIndex].isAnswered = true;
        }
        productques.questions[questionIndex].isAnsweredByVendor = true;

        const answerAt = Date.now();
        const date = new Date(answerAt);
        const answerDateTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
        
        const answerobj = {
            text: answer,
            isVendor: true,
            answeredBy: `Vendor: ${vendorInfo.name}`,
            answerAt: answerAt,
            answerDateTime: answerDateTime
        };
        await ProductQuestionModel.updateOne(
            { productId: req.params.productId, 'questions.quesId': quesId },
            {
              $push: { 'questions.$.answers': answerobj }, 
              $set: { 'questions.$.isAnswered': true }    
            }
          );
        
        res.status(200).json({
            success: true,
            message: "Question Answered successfully"
        } )
      
     }
     catch(err){
        console.log(err)
        res.status(500).json({
            success: false,
            message: "Unable to post answer"
        })
     }
})

router.post('/updateDeliveryStatus', vendorAuth, async function(req,res){
    try{
        const deliverAt = Date.now();
        const date = new Date(deliverAt);
        const deldatetime = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

        const vendorId = req.vendorId
        const {orderId, LineId} = req.body
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