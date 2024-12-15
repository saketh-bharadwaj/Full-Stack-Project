import express from 'express';
import imgupload from '../../controllers/routeupload.js';
import imageUploadToCloudinary from '../../middlewares/uploadMiddleware.cjs';
import upload from '../../middlewares/multer.js';
import vendorAuth from '../../middlewares/vendorAuth.js';
import { ProductModel, ProductQuantityModel, ProductQuestionModel, ProductSalesModel } from '../../models/productModel.js';
import { VendorInfoModel, VendorSalesModel } from '../../models/vendorModel.js';

import { ProductReviewModel } from '../../models/productModel.js';
import mongoose from 'mongoose';
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

router.get('/productReviews', vendorAuth, async function (req,res){
    const vendorId = req.vendorId;
    try{
        const vendorProducts = await ProductModel.find({
            vendorId: vendorId
        })
        const productIds = vendorProducts.map(product => product._id);
        const productData = vendorProducts.map(product => ({
            name: product.name,
            image: product.image[0]
          }));
        let reviewData=[]
        productIds.forEach(async (id,index)=>{
            const productReview = await ProductReviewModel.findOne({
                productId: id
            })
            
        })
    }catch(e){}
})

export default router;