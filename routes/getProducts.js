import express from 'express';
import { ProductModel, ProductQuantityModel, ProductQuestionModel, ProductReviewModel, ProductSalesModel } from '../models/productModel.js';
import { VendorInfoModel } from '../models/vendorModel.js';

const router = express.Router();

router.get('/products', async function (req, res) {
  try {
   
    const products = await ProductModel.find(); 

    
    const productQuantities = await ProductQuantityModel.find(); 
    const productReviews = await ProductReviewModel.find();

   
    const productsWithQuantities = products.map(product => {
      
      const productQuantity = productQuantities.find(
        (quantity) => quantity.productId.toString() === product._id.toString()
      );
      const productRating = productReviews.find(
        (productReview) => productReview.productId.toString() === product._id.toString()
      );
      
      if (productQuantity && productRating) {
        return {
          ...product.toObject(),  
          hasVariant: productQuantity.hasVariant,  
          variantType: productQuantity.variantType,
          quantity: productQuantity.quantity,
          total: productQuantity.total, 
          hasReviews: productRating.hasReviews,
          reviews: productRating.reviews
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

    
    // merge product and its quantity,questions,reviews
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

//trending products  top 15
router.get('/trendingProducts', async function (req, res) {
  try {
      
      const productSales = await ProductSalesModel.find();

      
      const topProducts = productSales
          .sort((a, b) => b.quantitySold - a.quantitySold) 
          .slice(0, 15) // Take top 15
          .map((product) => ({
              productId: product.productId,
              quantitySold: product.quantitySold
          }));

      
      const productDetails = await Promise.all(
          topProducts.map(async (product) => {
              const productInfo = await ProductModel.findOne({ _id: product.productId });
              return {
                  productId: product.productId,
                  quantitySold: product.quantitySold,
                  name: productInfo?.name || "Unknown Product", // Fallback if no product found
                  image: productInfo?.image?.[0] || null // Fallback if no image available
              };
          })
      );

      // Step 4: Send the response
      res.status(200).json({
          success: true,
          trendingProducts: productDetails
      });
  } catch (err) {
      console.error("Error fetching trending products:", err);
      res.status(500).json({
          success: false,
          message: "Unable to fetch trending products",
          error: err.toString()
      });
  }
});


export default router;

