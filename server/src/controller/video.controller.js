import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from "cloudinary";

// ─────────────────────────────────────────────
// Helper: extract Cloudinary public_id from URL
// ─────────────────────────────────────────────
const extractPublicId = (cloudinaryUrl) => {
    if (!cloudinaryUrl) return null;
    // URL pattern: https://res.cloudinary.com/<cloud>/video/upload/v<ver>/<public_id>.<ext>
    const parts = cloudinaryUrl.split("/");
    const fileWithExt = parts[parts.length - 1];
    const publicId = fileWithExt.split(".")[0];
    return publicId;
};

const deleteFromCloudinary = async (url, resourceType = "image") => {
    const publicId = extractPublicId(url);
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (err) {
        console.error(`Cloudinary delete failed for ${publicId}:`, err.message);
    }
};


const getAllVideos = asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 10,
        query = "",
        sortBy = "createdAt",
        sortType = "desc",
        userId,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));

    // Build match stage
    const matchStage = { isPublished: true };

    if (query.trim()) {
        matchStage.$or = [
            { title: { $regex: query.trim(), $options: "i" } },
            { description: { $regex: query.trim(), $options: "i" } },
        ];
    }

    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        matchStage.owner = new mongoose.Types.ObjectId(userId);
    }

    const sortOrder = sortType === "asc" ? 1 : -1;
    const allowedSortFields = ["createdAt", "views", "duration", "title"];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    const aggregatePipeline = Video.aggregate([
        { $match: matchStage },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1 } }],
            },
        },
        { $addFields: { owner: { $first: "$ownerDetails" } } },
        { $project: { ownerDetails: 0 } },
        { $sort: { [safeSortBy]: sortOrder } },
    ]);

    const options = { page: pageNum, limit: limitNum };

    const videos = await Video.aggregatePaginate(aggregatePipeline, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }

    const videoLocalPath = req.files?.videoFile?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required");
    }
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is required");
    }

    // Upload both files concurrently
    const [videoFile, thumbnail] = await Promise.all([
        uploadOnCloudinary(videoLocalPath),
        uploadOnCloudinary(thumbnailLocalPath),
    ]);

    if (!videoFile?.url) {
        throw new ApiError(500, "Error while uploading video file");
    }
    if (!thumbnail?.url) {
        throw new ApiError(500, "Error while uploading thumbnail");
    }

    const video = await Video.create({
        title: title.trim(),
        description: description.trim(),
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration ?? 0,
        owner: req.user._id,
        isPublished: true,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [{ $project: { fullName: 1, username: 1, avatar: 1 } }],
            },
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
                owner: { $first: "$ownerDetails" },
                likesCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false,
                    },
                },
            },
        },
        { $project: { ownerDetails: 0, likes: 0 } },
    ]);

    if (!video?.length) {
        throw new ApiError(404, "Video not found");
    }


    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: { watchHistory: videoId },
    });

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!title?.trim() && !description?.trim() && !req.file) {
        throw new ApiError(400, "At least one field (title, description, thumbnail) must be provided");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Only owner can update
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updates = {};

    if (title?.trim()) updates.title = title.trim();
    if (description?.trim()) updates.description = description.trim();

    // Handle optional thumbnail replacement
    if (req.file?.path) {
        const newThumbnail = await uploadOnCloudinary(req.file.path);
        if (!newThumbnail?.url) {
            throw new ApiError(500, "Error while uploading new thumbnail");
        }
        // Delete old thumbnail from Cloudinary
        await deleteFromCloudinary(video.thumbnail, "image");
        updates.thumbnail = newThumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: updates },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});


const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Only owner can delete
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Remove assets from Cloudinary concurrently
    await Promise.all([
        deleteFromCloudinary(video.videoFile, "video"),
        deleteFromCloudinary(video.thumbnail, "image"),
    ]);

    await Video.findByIdAndDelete(videoId);

    // Cascading deletes: clean up related documents
    await Comment.deleteMany({ video: videoId });
    await Like.deleteMany({ video: videoId });
    await Playlist.updateMany(
        { videos: videoId },
        { $pull: { videos: videoId } }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, { videoId }, "Video deleted successfully"));
});


const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to toggle publish status");
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        { $set: { isPublished: !video.isPublished } },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(
            200,
            { isPublished: updatedVideo.isPublished },
            `Video ${updatedVideo.isPublished ? "published" : "unpublished"} successfully`
        )
    );
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
};