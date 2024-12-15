import express from 'express'
import userAuth from '../../middlewares/userAuth.js';
import { ProductModel, ProductReviewModel, ProductQuantityModel,ProductQuestionModel, ProductSalesModel } from '../../models/productModel.js';
import { UserModel, UserInfoModel, UserCartModel, CartModel, UserOrderHistoryModel } from '../../models/userModel.js';
import { VendorInfoModel, VendorSalesModel } from '../../models/vendorModel.js';
import {calculateDistanceAndCost as cal_cost} from '../../middlewares/distance_calc.js';
import mongoose from 'mongoose';
import { OrderModel } from '../../models/adminModel.js';
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

function orderIdGenerator() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const date = new Date();
  
  // Get the date in YYYYMMDD format
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const datePart = `${year}${month}${day}`; // Example: '20241123'

  
  let orderpart = '';
  for (let i = 0; i < 8; i++) {
    orderpart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  let orderId = datePart +orderpart;
  // Combine the date and random part
  return orderId;
}

function getPlatformfee(){
  // will later write logic for that, currently returning 10% remember to take Category and SubCategory as params
  return 10
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
    console.log(err)
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
    const u_address = user_address.address;

   
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
      const images = product.image
      let applieddisc = 0
      let discountType;
      
      if(discount.admin.disc>=discount.vendor.disc) {
        applieddisc = discount.admin.disc
        discountType = 1 // 1 corresponds to admin discount
      }
      else {
        applieddisc = discount.vendor.disc
        discountType = 2; // 2 corresponds to vendor discount
      } 
      
      
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
      const discountPercentage = applieddisc ? (applieddisc / 100) : 0;
      const subtotal2 = subtotal1 - (subtotal1 *  discountPercentage);  // After discount
      //console.log("subtotal 1 = "+ subtotal1)
      //console.log("Sub total 2 = " + subtotal2)
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
        images, 
        variant,
        quantity,
        discount: applieddisc,
        discountType,
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
    usercart.addId = addId;
    usercart.address = u_address;
    usercart.pincode = user_pincode;

   
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
    console.error(err);
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

    const user_info = await UserInfoModel.findOne({
      userId : req.userId
    })

    const user_pincode = user_info.address.find(item => item.addressId===usercart.addId)
    const cart_items = usercart.items;

    const userOrderHistory = await UserOrderHistoryModel.findOne({
      userID: req.userId
    })
    
    let custorderItems=[];
    let custorderValue=0;

    let adminOrderValue = 0;
    let adminOrderRevenue = 0;
    let adminOrderProfit = 0;
    let adminOrderItems =[];

    const orderId = orderIdGenerator();
    const orderAt = Date.now();
    const date = new Date(orderAt);
    const orderDateTime = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

    

    let linecounter = 1;

    for(let item of cart_items){
      const eligible = item.eligible

      //if product is eligible, then only do the following steps
      if(eligible){
        //user order history
        let product = {
          LineId: linecounter,
          orderTimeStamp: orderAt,
          orderDateTime: orderDateTime,
          orderStatus: "Active",
          orderStatusCode: 0,
          deliveryStatusCode: 0,
          deliveryStatus: "Order Placed",
          isDelivered: false,
          deliveryDateTime:"NA",
          deliveryBy: productInfo.delivery,
          eta: item.eta,
          productId: item.productId,
          productName: item.name,
          productRate: item.price,
          discountApplied: item.discount,
          originalPrice: item.subtotal1,
          discountedPrice: item.subtotal2,
          shipping: item.shipping_cost,
          totalPrice: item.totalPrice,
          quantity: item.quantity,
          variant: item.variant,
          image: item.images[0],
          vendorId: item.vendorId,
          vendorName: item.vendorName,
        }
        //add the product to history of user
        custorderItems.push(product)
        custorderValue+=item.totalPrice

        const productInfo = await ProductModel.findOne({
          _id: item.productId
        })
        const vendorsales = await VendorSalesModel.findOne({
          vendorId: item.vendorId,
        })

        let adminfee = 0;
        let vendorRevenue = 0;
        let platformFee = getPlatformfee(); // Ensure platformFee is a valid number
        platformFee = platformFee/100;
        
        if (!isNaN(platformFee)) {
            if (item.discountType === 1) {
                let vendorDiscount = parseInt(productInfo.discount.vendor.disc || 0);
                let newTotal = parseInt(item.subtotal1) - (parseInt(item.subtotal1 || 0) * vendorDiscount);
                adminfee = newTotal * platformFee;
                vendorRevenue+=  newTotal - adminfee;
            } else if (item.discountType === 2) {
                adminfee = parseInt(item.subtotal2 || 0) * platformFee;
                vendorRevenue+= item.subtotal2 - adminfee;
            }
        }

        let vendorProfit = vendorRevenue - (parseInt(productInfo.costPrice) * (item.quantity));


        let newVendorSale = {
          orderId: orderId,
          LineId: linecounter,
          orderTimeStamp: orderAt,
          orderDateTime: orderDateTime,
          orderStatus: "Active",
          orderStatusCode: 0,
          deliveryStatusCode: 0,
          deliveryStatus: "Order Placed",
          deliveryBy: productInfo.delivery,
          eta: item.eta,
          isDelivered: false,
          deliveryDateTime:"NA",
          productId: item.productId,
          productName: item.name,
          saleRevenue: vendorRevenue,
          saleProfit: vendorProfit,
          quantity: item.quantity,
          variant: item.variant,
          image: item.images[0],
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          custId: user_info.userId,
          custName: user_info.name,
          custPic: user_info.image[0],
          deliveryAdd: usercart.address,
          deliveryPincode: usercart.pincode,
        }

        //put new sale to vendor profile
        vendorsales.sales.push(newVendorSale);
        vendorsales.totalRevenue += parseInt(newVendorSale.saleRevenue);
        vendorsales.totalProfits +=parseInt(newVendorSale.saleProfit);

        await vendorsales.save();

        let adminOrder = {
          LineId: linecounter,
          orderStatus: "Active",
          orderStatusCode: 0,
          deliveryStatusCode: 0,
          deliveryStatus: "Order Placed",
          eta: item.eta,
          deliveryBy: productInfo.delivery,
          isDelivered: false,
          deliveryDateTime:"NA",
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          variant: item.variant,
          image: item.images[0],
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          pricePaid: item.totalPrice,
          itemShipping: item.shipping_cost,
          itemProfit: adminfee
        }
        adminOrderItems.push(adminOrder);
        adminOrderValue+=item.totalPrice;
        adminOrderRevenue+=adminfee + item.shipping_cost;
        adminOrderProfit += adminfee;

        const ProductSale = await ProductSalesModel.findOne({
          productId: item.productId
        })

        let newProductSale = {
          custId: user_info.userId,
          custName: user_info.name,
          custPic: user_info.image[0],
          deliveryAdd: usercart.address,
          deliveryPincode: usercart.pincode,
          quantity: item.quantity,
          variant: item.variant,
          saleRevenue: item.totalPrice,
        }
        ProductSale.sales.push(newProductSale)
        ProductSale.quantitySold+=item.quantity;
        ProductSale.productRevenue+=item.totalPrice;
        await ProductSale.save();

        

        const ProductQuantity = await ProductQuantityModel.findOne({
          productId: item.productId
        });
  
        const subtractQuan = item.quantity
        //my way of doing it
        let quantityarr = ProductQuantity.quantity
        quantityarr.forEach(variant => {
          if(variant.type===item.variant){
            variant.quantity = parseInt(variant.quantity) - subtractQuan
          }
        })
        ProductQuantity.markModified('quantity');
        ProductQuantity.total-=subtractQuan;

        await ProductQuantity.save();

        linecounter+=1;
      }

    }
    let custnewOrder = {
      orderId: orderId,
      orderTimeStamp: orderAt,
      orderDateTime: orderDateTime,
      orderItems: custorderItems,
      orderValue: usercart.grandtotal,
      deliveryAdd: usercart.address,
      deliveryPincode: usercart.pincode,

    }
    userOrderHistory.orderHistory.push(custnewOrder)
    await userOrderHistory.save();

    await OrderModel.create({
      orderId,
      custId: user_info.userId,
      custName: user_info.name,
      custPic: user_info.image[0],
      orderAt,
      orderDateTime,
      orderItems: adminOrderItems,
      orderValue: adminOrderValue,
      orderRevenue: adminOrderRevenue,
      orderProfit: adminOrderProfit
    })

    usercart.items=[]
    usercart.beforeDiscount=0;
    usercart.hasItems = false;
    usercart.grandtotal=0;
    usercart.totalShipping=0;
    usercart.afterDiscount=0;

    await usercart.save();

    res.json({
      success: true,
      message: "Order Placed Successfully"
    })

  }catch(err){
    console.log(err)
    res.status(500).json({
      success: false,
      message: "unable to fetch cart/ process payment"
    })

  }
})

//get order history
router.get('/orderHistory', userAuth, async function (req, res){
  try{
    const orderHistory = await UserOrderHistoryModel.findOne({
      userID: req.userId
    })

    res.status(200).json({
      success: true,
      data: orderHistory
    })
  }catch(err){
    res.status(500).json({
      success: false,
      message: "Unable to get Order History"
    })
  }
})



export default router;