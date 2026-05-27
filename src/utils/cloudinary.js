import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload the file in Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been successfully uploaded

    // console.log("File is uploaded on cloudinary");
    // console.log(response.url);
    fs.unlinkSync(localFilePath)
    return response;
    console.log(response);
    
  } catch (error) {
    console.log("Cloudinary Error:", error);

    fs.unlinkSync(localFilePath);

    return null;

    //remove the locally saved temporary file as the upload opration got failed
  }
};

export { uploadOnCloudinary };
