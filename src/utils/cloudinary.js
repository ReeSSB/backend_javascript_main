import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //   file has been uploaded successfully.
    // console.log("File uploaded successfully on cloudinary.", response.url);

    fs.unlinkSync(localFilePath); // file will be removed synchronously.
    // console.log("cloudinary response:", response);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); //It removes the locally saved temporary file as operation got failed.
    console.log(`Error in file uploading on cloudinary:${error}`);
    return null;
  }
};

export { uploadOnCloudinary };

// cloudinary.uploader.upload(
//   "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function (error, result) {
//     console.log(result);
//   }
// );
