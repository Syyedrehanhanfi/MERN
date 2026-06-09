import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  // Cannot subscribe to yourself
  if (channelId.toString() === req.user._id.toString()) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const channelExists = await User.findById(channelId).select("_id");
  if (!channelExists) {
    throw new ApiError(404, "Channel not found");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribed: false },
          "Unsubscribed successfully"
        )
      );
  }

  await Subscription.create({
    subscriber: req.user._id,
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { subscribed: true }, "Subscribed successfully")
    );
});


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const channelExists = await User.findById(channelId).select("_id");
  if (!channelExists) {
    throw new ApiError(404, "Channel not found");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(channelId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
        pipeline: [
          { $project: { fullName: 1, username: 1, avatar: 1 } },
        ],
      },
    },
    {
      $addFields: {
        subscriber: { $first: "$subscriberDetails" },
      },
    },
    {
      $project: { subscriberDetails: 0, channel: 0 },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscriberCount: subscribers.length, subscribers },
        "Subscribers fetched successfully"
      )
    );
});


const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  const userExists = await User.findById(subscriberId).select("_id");
  if (!userExists) {
    throw new ApiError(404, "User not found");
  }

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: { subscriber: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
        pipeline: [
          { $project: { fullName: 1, username: 1, avatar: 1 } },
        ],
      },
    },
    {
      // Join subscriptions again to get this user's subscriber count for each channel
      $lookup: {
        from: "subscriptions",
        localField: "channel",
        foreignField: "channel",
        as: "channelSubscribers",
      },
    },
    {
      $addFields: {
        channel: { $first: "$channelDetails" },
        subscriberCount: { $size: "$channelSubscribers" },
        // Check if the requesting user is still subscribed (always true here, but useful for UI)
        isSubscribed: true,
      },
    },
    {
      $project: { channelDetails: 0, channelSubscribers: 0, subscriber: 0 },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { channelCount: subscribedChannels.length, channels: subscribedChannels },
        "Subscribed channels fetched successfully"
      )
    );
});

export {
  toggleSubscription,
  getUserChannelSubscribers,
  getSubscribedChannels,
};