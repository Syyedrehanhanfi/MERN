import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary, uploadOnCloudinary} from "../utils//cloudinary.js"
import {ApiResponse} from "../utils/apiResponse.js"


const registerUser = asyncHandler(async (req, res) => {
  //get data from req body
  //check validation - not empty
  //if check user already exists -- username email
  //check for avatar check for coverImage
  //if check avatar is required
  //then avatar and coverImage upload on Cloudinary check avatar
  // create user object -create entry in DB
  //remove password and refreshToken fields from resposne
  //check from user creation
  //return response

  const { fullName, email, username, password } = req.body;
  console.log(email);

  if (
    [fullName, email, username, password].some((fields) => {
      return fields.trim() === "";
    })
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new ApiError(409, "User with email or username is already exists");
  }

  const localAvatarPath = req.files?.avatar[0]?.path;

  const localCoverImagePath = req.files?.coverImage[0]?.path;

  if (!localAvatarPath) {
    throw new ApiError(400, "avatar file is required");
  }


  //upload on Cloudinary

  const avatar = await uploadOnCloudinary(localAvatarPath)

  const coverImage = await uploadOnCloudinary(localCoverImagePath)

  if(!avatar){
    throw new ApiError(400, "Avatar is required")
  }

  const user = await User.create({
       fullName,
       avatar : avatar.url,
       coverImage : coverImage?.url || "",
       email,
       password,
       username : username.lowerCase()



  })

   const createdUser  = await User.findById(user._id).select("-password -refreshToken" )

   if(!createdUser){
    throw new ApiError(500, "something went wrong while registering the user")
   }

   
   return res.status(201).json(
    new ApiResponse(200, createdUser, "User registered successfully")
   )

});







export { registerUser };
