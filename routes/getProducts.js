import express from 'express';
import { ProductModel, ProductQuantityModel, ProductQuestionModel, ProductReviewModel } from '../models/productModel.js';
import { VendorInfoModel } from '../models/vendorModel.js';

const router = express.Router();

router.get('/products', async function (req, res) {
  try {
   
    const products = await ProductModel.find(); 

    
    const productQuantities = await ProductQuantityModel.find(); 

   
    const productsWithQuantities = products.map(product => {
      
      const productQuantity = productQuantities.find(
        (quantity) => quantity.productId.toString() === product._id.toString()
      );

      
      if (productQuantity) {
        return {
          ...product.toObject(),  
          hasVariant: productQuantity.hasVariant,  
          variantType: productQuantity.variantType,
          quantity: productQuantity.quantity,
          total: productQuantity.total  
        };
      } else {
       
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

