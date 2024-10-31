import { CartModel, UserInfoModel } from "./models/userModel.js";


let testfunction = async () =>{
    const UserId = "671d29f16981e3f6b653ede2"
   try{
    const usercart = await UserInfoModel.findOne({
        userId: UserId
    }).exec();
    console.log(usercart)

   }
   catch(err){
    console.error(err)
   }
    
   
}

testfunction();