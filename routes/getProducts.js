import express from 'express';
import { ProductModel, ProductQuantityModel, ProductQuestionModel, ProductReviewModel } from '../models/productModel.js';
import { VendorInfoModel } from '../models/vendorModel.js';

const router = express.Router();

router.get('/products', async function (req, res) {
  try {
    // Step 1: Fetch all products
    const products = await ProductModel.find(); // Retrieve all products

    // Step 2: Fetch all product quantities
    const productQuantities = await ProductQuantityModel.find(); // Retrieve all quantities

    // Step 3: Combine product and quantity information
    const productsWithQuantities = products.map(product => {
      // Find the corresponding quantity information for this product
      const productQuantity = productQuantities.find(
        (quantity) => quantity.productId.toString() === product._id.toString()
      );

      // If there is a corresponding quantity, merge the data
      if (productQuantity) {
        return {
          ...product.toObject(),  // Convert mongoose document to plain object
          hasVariant: productQuantity.hasVariant,  // Add hasVariant field
          variantType: productQuantity.variantType,  // Add variantType field
          quantity: productQuantity.quantity,
          total: productQuantity.total  // Add the array of quantities (type and quantity)
        };
      } else {
        // If no quantity info exists, return the product as is
        return product.toObject();
      }
    });

    // Step 4: Send the result as a success response
    res.json({
      success: true,
      data: productsWithQuantities
    });

  } catch (error) {
    // Handle any errors
    res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving products',
      error: error.message
    });
  }
});

router.get('/product/:productId', async function (req, res){
  try{
    const product = await ProductModel.findOne({
      _id: req.params.productId
    })
    const productQuantity = await ProductQuantityModel.findOne({
      productId: req.params.productId
    })
    const ProductReview = await ProductReviewModel.findOne({
      productId: req.params.productId
    })
    const ProductQues = await ProductQuestionModel.findOne({
      productId: req.params.productId
    })

    
    // merge product and its quantity
    let responseData = product.toObject();
    if (productQuantity) {
      responseData = {
        ...responseData,
        hasVariant: productQuantity.hasVariant,
        variantType: productQuantity.variantType,
        quantity: productQuantity.quantity,
        total: productQuantity.total,
        hasReviews: ProductReview.hasReviews,
        reviews: ProductReview.reviews,
        hasQuestions: ProductQues.hasQuestions,
        questions: ProductQues.questions
      };
    }

    res.status(200).json({
      success: true,
      message: "Product found - check data",
      data: responseData
    })

  }catch(err){
    console.log(err)
    res.status(500).json({
      success: false,
      message: "Product not found"
    })
  }
})

export default router;

