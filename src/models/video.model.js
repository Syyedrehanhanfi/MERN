import mongoose from "mongoose";
import aggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },

  videoFile: {
    type: String, //cloudinary url
    required: [true, "videoFile is required"]
  },
  thumbnail: {
    type: String, //cloudinary URL
    required: true
  },
  duration: {
    type: Number //cludinary 
  },
  views: {
    type: Number,
    defualt: 0
  },
  isPublished: {
    type: Boolean,
    defualt: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }

},
  { timestamps: true })

  videoSchema.plugin(aggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)