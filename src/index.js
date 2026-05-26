import connectDB from './db/index.js';
import dotenv from 'dotenv'
import { app } from './app.js';

dotenv.config({
  path: './.env'
})

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is runing at PORT ${process.env.PORT}`);

    })

    app.on("error", (err) => {
      console.log("ERROR: ", err);
      throw err

    })
  })
  .catch((err) => {
    console.log("MONGODB connection failed: ", err);

  })




//prodected routes

import userRoutes from "./routes/user.routes.js"

app.use("/api/v1/user", userRoutes)

//https://localhost:8000/api/v1/user/register




/*
import express from 'express';

const app =express()

;(
  async()=>{
      try {
        const connect = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on("Error",(error)=>{
          console.log("Error :", error);
          throw error
          
        })

        app.listen(process.env.PORT, ()=>{
          console.log(`App is listening on port ${process.env.PORT}`);
          
        })

      } catch (error) {
        console.error("Error :", error),
        throw error
      }
  }
)()
  */