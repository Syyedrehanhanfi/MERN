import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getChannelStats = asyncHandler(async (req, res) => {
  const channelId = new mongoose.Types.ObjectId(req.user._id);

  // Total subscribers
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });

  // Per-video aggregation: total views + total likes across all channel videos
  const videoStats = await Video.aggregate([
    {
      $match: { owner: channelId },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "videoLikes",
      },
    },
    {
      $group: {
        _id: null,
        totalVideos: { $sum: 1 },
        totalViews: { $sum: "$views" },
        totalLikes: { $sum: { $size: "$videoLikes" } },
      },
    },
  ]);

  const stats = videoStats[0] || {
    totalVideos: 0,
    totalViews: 0,
    totalLikes: 0,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSubscribers,
        totalVideos: stats.totalVideos,
        totalViews: stats.totalViews,
        totalLikes: stats.totalLikes,
      },
      "Channel stats fetched successfully"
    )
  );
});


const getChannelVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } =
    req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const sortOrder = sortType === "asc" ? 1 : -1;

  const allowedSortFields = ["createdAt", "views", "duration", "title"];
  const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

  const channelId = new mongoose.Types.ObjectId(req.user._id);

  const aggregatePipeline = Video.aggregate([
    {
      $match: { owner: channelId },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    { $project: { likes: 0 } },
    { $sort: { [safeSortBy]: sortOrder } },
  ]);

  const options = { page: pageNum, limit: limitNum };
  const videos = await Video.aggregatePaginate(aggregatePipeline, options);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };