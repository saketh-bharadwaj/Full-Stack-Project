import express from 'express'
import userAuth from '../../middlewares/userAuth.js';
import { ProductModel, ProductReviewModel, ProductQuantityModel,ProductQuestionModel } from '../../models/productModel.js';
import { UserModel, UserInfoModel, UserCartModel, CartModel } from '../../models/userModel.js';
import mongoose from 'mongoose';
const ObjectId = mongoose.Types.ObjectId;
const router = express.Router();

function generateRandomId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

router.post('/addReview/',userAuth, async function (req, res) {
    const {productId, ratings, review} = req.body;
    
  
    try {
      
      const foundProduct = await ProductReviewModel.findOne({ productId: productId });
      const user = await UserInfoModel.findOne({
        userId: req.userId
      })
      if (foundProduct) {
        // If hasReviews is false, set it to true
        if (!foundProduct.hasReviews) {
          foundProduct.hasReviews = true;
        }
        const reviewAt = Date.now();
        const date = new Date(reviewAt)
        const reviewDateTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
        const userpic = user.image[0];
        const newReview = {
          userId: req.userId,          
          name: req.user_name,  
          userpic: userpic,       
          ratings: ratings,        
          review: review,
          reviewAt: reviewAt,
          reviewDateTime: reviewDateTime         
        };
  
        foundProduct.reviews.push(newReview);
  
        // Save the updated document back to the database
        await foundProduct.save();
        
        const returndata = {
          hasReviews: foundProduct.hasReviews,
          reviews: foundProduct.reviews
        }

        return res.status(200).json({
          success: true,
          message: 'Review added successfully',
          data: returndata
        });
      } else {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
  
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while adding the review'
      });
    }
  });
  
router.get('/profile', userAuth, async function (req,res){
  try{
    const userdata = await UserInfoModel.findOne({
      userId: req.userId
    })
    console.log(userdata)
    if(userdata){
      res.json({
        success: true,
        data: userdata
      })
    }
    else{
      res.status(403).json({
        success: false,
        message: "user not found"
      })
    }
  }
  catch(err){
    res.status(403).json({
      success: false,
      message: "user not found"
    })

  }
})

router.post('/addNewAddress', userAuth, async function(req,res){
   try{ 
      const user = await UserInfoModel.findOne({
      userId: req.userId
      })
      const {newadd} = req.body
      
      const addId = generateRandomId();

      const newaddobj = {
        addressId: addId,
        address: newadd
      }

      user.address.push(newaddobj);

      await user.save();

      res.status(200).json({
        success: true,
        message: "address added succesfully",
        data: user
      })
  }catch(err){
    res.status(500).json({
      success: false,
      message: "unable to add address"
    })
  }
})

router.post('/addQuestion/:productId', userAuth, async function(req, res){
  try{
    const {question} = req.body;
    
    const productques = await ProductQuestionModel.findOne({
      productId: req.params.productId
    })
    const quesId = generateRandomId();
    const askedAt = Date.now();
    const actualDate = new Date(askedAt);
    const askedDateTime = `${actualDate.toLocaleDateString()} ${actualDate.toLocaleTimeString()}`
    const questionobj = {
      isAnswered: false,
      isAnsweredByVendor: false,
      quesId: quesId,
      text: question,
      answers: [],
      askedBy: req.user_name,
      askedAt: askedAt,
      askedDateTime: askedDateTime
    }
    
    productques.questions.push(questionobj)
    if(productques.hasQuestions === false) productques.hasQuestions = true;
    await productques.save();
    
    const returndata = {
      hasQuestions: productques.hasQuestions,
      questions: productques.questions
    }

    res.status(200).json({
        success: true,
        message: "Posted question succesfully",
        data: returndata
    })

  }catch(err){
    res.status(500).json({
      success: false,
      message: "unable to add question"
    })
  }
})

router.post('/answerQues/:productId', userAuth, async function (req, res) {
  const { quesId, answer } = req.body;
  try {
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

    const answerAt = Date.now();
    const date = new Date(answerAt);
    const answerDateTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    const answerobj = {
      text: answer,
      isVendor: false,
      answeredBy: req.user_name,
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
    

    
    const updatedProductQues = await ProductQuestionModel.findOne({
      productId: req.params.productId
    });

    const returndata={
      hasQuestions: updatedProductQues.hasQuestions,
      questions: updatedProductQues.questions
    }

    return res.status(200).json({
      success: true,
      message: "Answer Posted Successfully",
      data: returndata
    });
    
  } catch (err) {
    console.error("Error saving the answer:", err);  // Log the error for debugging
    res.status(500).json({
      success: false,
      message: "Unable to post the answer"
    });
  }
});

router.post('/update-cart', userAuth, async function (req, res) {
  const { items } = req.body;
 
  try {
    
    const usercart = await CartModel.findOne({
      userId: req.userId
    })
    
    
    // Ensure that the usercart exists
    if (!usercart) {
      return res.status(404).json({
        success: false,
        message: "User cart not found"
      });
    }

    // If items is an empty array, reset the cart
    if (!items || items.length === 0) {
      usercart.items = [];
      usercart.hasItems = false;
      usercart.beforeDiscount = 0;
      usercart.total = 0;

      await usercart.save();
      return res.status(200).json({
        success: true,
        message: 'Cart updated successfully',
        data: usercart
      });
    }

    
    const newItems = [];
    let beforeDiscount = 0;
    let total = 0;

   
    for (let item of items) {
      const { productId, variant, quantity } = item;
      
      
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const price = product.price; 
      const discount = product.discount;
      const productname = product.name;
      let applieddisc = 0
      
      if(discount.admin.disc>=discount.vendor.disc) {
        applieddisc = discount.admin.disc
      }
      else applieddisc = discount.vendor.disc
      
      const productQuantity = await ProductQuantityModel.findOne({ productId });
      if (!productQuantity) {
        return res.status(404).json({ success: false, message: 'Product quantity not found' });
      }

      
      const variantInfo = productQuantity.quantity.find(q => q.type === variant);
      const availableQuantity = variantInfo ? parseInt(variantInfo.quantity) : 0;

      // Determine if the requested quantity is eligible
      const eligible = quantity <= availableQuantity;
      const left = eligible ? 0 : availableQuantity;

      // Calculate subtotals
      const subtotal1 = price * quantity;  // Before discount
      const discountPercentage = applieddisc ? applieddisc / 100 : 0;
      const subtotal2 = subtotal1 * (1 - discountPercentage);  // After discount

      // Add to running totals
      beforeDiscount += subtotal1;
      total += subtotal2;

      // Create a new item object for the cart
      newItems.push({
        productId,
        name: productname,
        variant,
        quantity,
        discount: applieddisc,
        price,
        eligible,
        left,
        subtotal1,
        subtotal2
      });
    }

    // Update the user's cart with the new items
    usercart.items = newItems;
    usercart.hasItems = newItems.length > 0;
    usercart.beforeDiscount = beforeDiscount;
    usercart.total = total;

    // Save the updated cart
    await usercart.save();

    // Return the updated cart details
    return res.status(200).json({
      success: true,
      message: 'Cart updated successfully',
      data: usercart
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Unable to update the cart',
      error: err.message
    });
  }
});

router.get('/cart', userAuth, async function(req, res){
  try{
    const usercart = await CartModel.findOne({
      userId: req.userId
    })

    
    
    res.status(200).json({
      success: true,
      cart: usercart
    })
  }catch(err){
    res.status(500).json({
      success: false,
      message: "unable to fetch cart now"
    })
  }

})



export default router;