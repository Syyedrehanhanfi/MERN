import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleLike = async (filter) => {
  const existingLike = await Like.findOne(filter);

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return { liked: false };
  }

  await Like.create(filter);
  return { liked: true };
};

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const result = await toggleLike({
    video: videoId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.liked ? "Video liked successfully" : "Video like removed"
      )
    );
});


const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const result = await toggleLike({
    comment: commentId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.liked ? "Comment liked successfully" : "Comment like removed"
      )
    );
});


const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const result = await toggleLike({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        result,
        result.liked ? "Tweet liked successfully" : "Tweet like removed"
      )
    );
});


const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user._id),
        video: { $exists: true, $ne: null },
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoDetails",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "ownerDetails",
              pipeline: [
                { $project: { fullName: 1, username: 1, avatar: 1 } },
              ],
            },
          },
          {
            $addFields: { owner: { $first: "$ownerDetails" } },
          },
          { $project: { ownerDetails: 0 } },
        ],
      },
    },
    {
      // Only include likes where the video still exists and is published
      $match: {
        "videoDetails.isPublished": true,
      },
    },
    {
      $addFields: {
        video: { $first: "$videoDetails" },
      },
    },
    {
      $project: {
        videoDetails: 0,
        likedBy: 0,
        comment: 0,
        tweet: 0,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };