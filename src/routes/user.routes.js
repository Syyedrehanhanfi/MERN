import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAcessToken } from "../controller/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verfiyJWT} from "../middlewares/auth.middleware.js"
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount :1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]) 
    , registerUser);

    router.route("/login").post(loginUser)

   
    //secure route

    router.route("/logout").get(verfiyJWT, logoutUser)
    router.route("/refresh-token").post(refreshAcessToken)

export default router;