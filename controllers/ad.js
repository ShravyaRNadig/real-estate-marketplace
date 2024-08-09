import { uploadImageToS3, deleteImageFromS3 } from '../helpers/upload.js';
import { geocoderAddress } from '../helpers/google.js';
import Ad from "../models/ad.js";
import User from "../models/user.js";
import { nanoid } from "nanoid";
import slugify from 'slugify';

export const uploadImage = async (req, res) => {
    try {
        if (!req.files || req.files === 0) {
            return res.json({ error: "Image is required" });
        }
        //  if only one file is uploaded, multer returns it as a simple object, not array
        const files = Array.isArray(req.files) ? req.files : [req.files];

        // upload image to s3
        const results = await uploadImageToS3(files, req.user._id);
        // console.log("results", results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.json({
            error: "Upload Image failed",
        });
    }
};

export const removeImage = async (req, res) => {
    try {
        const { Key, uploadedBy } = req.body;

        // check if the current user id matches the uploadedBy id
        if (req.user._id !== uploadedBy) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        try {
            await deleteImageFromS3(Key)
            return res.json({ success: true })
        } catch (err) {
            console.log(err);
            res.json({
                error: "Remove image failed",
            });
        }
    } catch (err) {
        console.log(err);
        res.json({
            error: "Remove Image failed",
        });
    }
};

export const createAd = async (req, res) => {
    try {
        const {
            photos,
            description,
            address,
            propertyType,
            price,
            landSize,
            landsizetype,
            action
        } = req.body;

        const isRequired = (v) => {  // helper function to send error message
            res.json({ error: `${v} is required` });
        };

        if (!photos || photos.length === 0) return isRequired("Photos");
        if (!description) return isRequired("Description");
        if (!address.trim()) return isRequired("Address");
        if (!propertyType) return isRequired("Property Type");
        if (!price) return isRequired("Price");
        if (!action) return isRequired("Action");

        if (propertyType === "Land") {
            if (!landSize) return isRequired("Landsize");
            if (!landsizetype) return isRequired("Landsize Type");
        }

        const { location, googleMap } = await geocoderAddress(address);

        try {

            const ad = new Ad({
                ...req.body,
                slug: slugify(`${propertyType}-for-${action}-address-${address}-price-${price}-${nanoid(
                    6
                )}`),
                postedBy: req.user._id,
                location: {
                    type: 'Point',
                    coordinates: [location.coordinates[0], location.coordinates[1]]
                },
                googleMap,
            });
            await ad.save();

            // update user role to seller
            const user = await User.findByIdAndUpdate(req.user._id, {
                $addToSet: { role: "Seller" },
            });
            user.password = undefined;

            // res.json({ok:true});
            res.json({ ad, user });
        } catch (err) {
            console.log(err);
            res.json({
                error: "Create ad failed"
            });
        }
    } catch (err) {
        console.log(err);
        res.json({
            error: "Create ad failed",
        });
    }
};

export const read = async (req, res) => {
    try {
        const { slug } = req.params;

        const ad = await Ad.findOne({ slug })
            .select('-googleMap')
            .populate('postedBy', 'name username email phone company photo logo role');

        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }

        // related ads
        const related = await Ad.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: ad.location.coordinates,
                    },
                    distanceField: "dist.calculated",
                    maxDistance: 50000, //50km
                    spherical: true,
                },
            },
            {
                $match: {
                    _id: { $ne: ad }, //_id: { $ne: ad_id } when you are using with id
                    action: ad.action,
                    propertyType: ad.propertyType,
                },
            },
            {
                $limit: 3,
            },
            {
                $project: {
                    googleMap: 0,
                },
            },
        ]);

        // to populate postedBy in related ads
        const relatedWithPopulatedPostedBy = await Ad.populate(related, {
            path: 'postedBy',
            select: 'name username email phone company photo logo role',
        });

        res.json({ ad, related: relatedWithPopulatedPostedBy });
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to fetch. Try again",
        });
    }
};

export const listAdsForSell = async (req, res) => {
    try {
        const page = req.params.page || 1;
        const pageSize = 2;
        const skip = (page - 1) * pageSize;
        const totalAds = await Ad.countDocuments({ action: "Sell" });

        const ads = await Ad.find({ action: "Sell" })
            .populate('postedBy', 'name username email phone company photo logo role')
            .select('-googleMap')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);

        res.json({ ads, page, totalPages: Math.ceil(totalAds / pageSize) });
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to fetch. Try again",
        });
    }
};

export const listAdsForRent = async (req, res) => {
    try {
        const page = req.params.page || 1;
        const pageSize = 2;
        const skip = (page - 1) * pageSize;
        const totalAds = await Ad.countDocuments({ action: "Rent" });

        const ads = await Ad.find({ action: "Rent" })
            .populate('postedBy', 'name username email phone company photo logo role')
            .select('-googleMap')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);

        res.json({ ads, page, totalPages: Math.ceil(totalAds / pageSize) });
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to fetch. Try again",
        });
    }
};

export const updateAd = async (req, res) => {
    try {
        const { slug } = req.params;
        const {
            photos,
            description,
            address,
            propertyType,
            price,
            landSize,
            landsizetype,
            action
        } = req.body;

        const isRequired = (v) => {  // helper function to send error message
            res.json({ error: `${v} is required` });
        };

        if (!photos || photos.length === 0) return isRequired("Photos");
        if (!description) return isRequired("Description");
        if (!address.trim()) return isRequired("Address");
        if (!propertyType) return isRequired("Property Type");
        if (!price) return isRequired("Price");
        if (!action) return isRequired("Action");

        if (propertyType === "Land") {
            if (!landSize) return isRequired("Landsize");
            if (!landsizetype) return isRequired("Landsize Type");
        }

        const ads = await Ad.findOne({ slug }).populate("postedBy", "_id");

        if (!ad) {
            return res.status(401).json({ error: "Ad not found" });
        }

        // check if the logged in user is the owner of the ad
        if (ad.postedBy._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { location, googleMap } = await geocoderAddress(address);

        try {

            const ad = new Ad({
                ...req.body,
                slug: slugify(`${propertyType}-for-${action}-address-${address}-price-${price}-${nanoid(
                    6
                )}`),
                postedBy: req.user._id,
                location: {
                    type: 'Point',
                    coordinates: [location.coordinates[0], location.coordinates[1]]
                },
                googleMap,
            });
            await ad.save();

            // update user role to seller
            const user = await User.findByIdAndUpdate(req.user._id, {
                $addToSet: { role: "Seller" },
            });
            user.password = undefined;

            // res.json({ok:true});
            res.json({ ad, user });
        } catch (err) {
            console.log(err);
            res.json({
                error: "Create ad failed"
            });
        }
    } catch (err) {
        console.log(err);
        res.json({
            error: "Create ad failed",
        });
    }
};