import mongoose from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "username is required"],
    unique: true,
    lowercase: true,
    index: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, "email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  fullName: {
    type: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    avatar: {
      type: String, //cloudinary URL
      required: true
    },
    coverImage: {
      type: String //cloudinary URL
    },
    watchHistory: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Video'
      }
    ],
    password: {
      type: String,
      required: [true, 'password is required'] //encryed Password
    },

    refreshToken: {
      type: String
    }
  }

}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.isPasswordCorrent = async function (password) {
  return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,

    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  )
}

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.REFRESH_tOKEN_SECRET
    ,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  )
}


export const User = mongoose.model('User', userSchema)