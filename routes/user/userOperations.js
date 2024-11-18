import express from 'express'
import userAuth from '../../middlewares/userAuth.js';
import { ProductModel, ProductReviewModel, ProductQuantityModel,ProductQuestionModel } from '../../models/productModel.js';
import { UserModel, UserInfoModel, UserCartModel, CartModel, UserOrderHistoryModel } from '../../models/userModel.js';
import { VendorInfoModel } from '../../models/vendorModel.js';
import {calculateDistanceAndCost as cal_cost} from '../../middlewares/distance_calc.js';
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
      const {newadd,pincode} = req.body
      
      const addId = generateRandomId();

      const newaddobj = {
        addressId: addId,
        address: newadd,
        pincode: pincode
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
  const { items, addId } = req.body;
 
  try {
    
    const usercart = await CartModel.findOne({
      userId: req.userId
    })
    
    
    
    if (!usercart) {
      return res.status(404).json({
        success: false,
        message: "User cart not found"
      });
    }

    //if received an empty array - user removed all items from cart
    if (!items || items.length === 0) {
      usercart.items = [];
      usercart.hasItems = false;
      usercart.beforeDiscount = 0;
      usercart.afterDiscount =0;
      usercart.grandtotal =0;
      usercart.totalShipping=0;
      //usercart.total = 0;

      await usercart.save();
      return res.status(200).json({
        success: true,
        message: 'Cart updated successfully',
        data: usercart
      });
    }

    
    const newItems = [];
    let beforeDiscount = 0;
    let afterDiscount = 0;
    let totalShipping =  0;
    let grandTotal = 0;

    const user_info = await UserInfoModel.findOne({
      userId : req.userId
    })

    const user_address = user_info.address.find(item => item.addressId===addId)
    const user_pincode = user_address.pincode

   
    for (let item of items) {
      const { productId, variant, quantity } = item;
      
      
      const product = await ProductModel.findById(productId);

      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const vendorId = product.vendorId

      const vendorInfo = await VendorInfoModel.findOne({
        vendorId: vendorId
      })
      
      //calculate shipping charges if applicable
      const vendorName = vendorInfo.name
      const vendorPincode= vendorInfo.pincode
      

      let shipping_cost = parseInt(0)
      
      let {distance, cost: s_price} = cal_cost(user_pincode, vendorPincode)
      
      distance = parseInt(distance)
      s_price = parseInt(s_price)

      if(product.delivery==='company'){
        
        const ship_price =  parseInt(s_price) * parseInt(quantity);
        const weight_price = parseInt(product.weight) * parseInt(quantity);

        shipping_cost+= parseInt(ship_price + weight_price)
      }
      if (isNaN(shipping_cost)) {
        throw new Error('Shipping cost calculation resulted in NaN');
    }
 
      //calculate ETA
      let eta=0
      const productWeight = product.weight;
      if(productWeight<=10){
        if (distance <=5){
          eta = 1
        }
        else if(distance <=10){
          eta = 2
        }
        else if(distance <=15){
          eta = 3
        }
        else eta = 4
      }
      else {
        if (distance <=5){
          eta = 2
        }
        else if(distance <=10){
          
          eta = 3
        }
        else if(distance <=15){
          eta = 4
        }
        else eta = 5
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
      const totalPrice = subtotal2 + shipping_cost

      // Add to running totals
      beforeDiscount += parseInt(subtotal1);
      afterDiscount += parseInt(subtotal2)
      totalShipping+=parseInt( shipping_cost)
      grandTotal += parseInt(totalPrice);

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
        eta,
        vendorId,
        vendorName,
        subtotal1,
        subtotal2,
        shipping_cost,
        totalPrice
      });
    }

    
    usercart.items = newItems;
    usercart.hasItems = newItems.length > 0;
    usercart.beforeDiscount = parseInt(beforeDiscount);
    usercart.afterDiscount = parseInt(afterDiscount)
    usercart.totalShipping = parseInt(totalShipping)
    usercart.grandtotal = parseInt(grandTotal);

   
    await usercart.save();

    // Return
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

//send user token with header
router.post('/checkout', userAuth, async function(req, res){
  
  try{
    const usercart = await CartModel.findOne({
      userId: req.userId
    })
    

    /*
    step1: take each item from cart and calculate total price (incl. shipping if applicable)
    step2: considering shipping charges dont contribute to profits
    step3: for our company side take transaction value as total + shipping
    step4: take percentage from each product(+deleivery) as revenue for us. profit will be only our cut
    step5: price - our cut as revenue for vendor. also give purchase history for them
    step6: create trasaction history for each order 
    step7: empty the cart
    */

    const user_info = await UserInfoModel.findOne({
      userId : req.userId
    })

    const user_pincode = user_info.address.find(item => item.addressId===addId)
    const cart_items = usercart.items;

    const userOrderHistory = await UserOrderHistoryModel.findOne({
      userID: req.userId
    })

    for(let item of cart_items){
      const eligible = item.eligible

      //if product is eligible, then only do the following steps
      if(eligible){
        
        
        
      }
    }
    


    res.json({
      message: "Ok"
    })

  }catch(err){
    res.status(500).json({
      success: false,
      message: "unable to fetch cart/ process payment"
    })

  }
})



export default router;