import { uploadImageToS3, deleteImageFromS3 } from '../helpers/upload.js';
import { sendContactEmailToAgent } from "../helpers/email.js";
import { geocoderAddress } from '../helpers/google.js';
import { incrementViewCount } from '../helpers/ad.js'
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

export const readAd = async (req, res) => {
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

        // increment view 
        incrementViewCount(ad._id);

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
            return res.json({ error: `${v} is required` });
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

        const ad = await Ad.findOne({ slug }).populate('postedBy', '_id');

        // Check if ad was found
        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }

        // Check if postedBy exists before accessing _id
        if (!ad.postedBy || !ad.postedBy._id) {
            console.log(ad.postedBy)
            return res.status(400).json({ error: "Ad postedBy information is incomplete" });
        }


        // Check if the logged-in user is the owner of the ad
        if (ad.postedBy._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const { location, googleMap } = await geocoderAddress(address);

        try {
            const updatedAd = await Ad.findOneAndUpdate({ slug }, {
                ...req.body,
                slug: slugify(`${propertyType}-for-${action}-address-${address}-price-${price}-${nanoid(6)}`),
                location: {
                    type: 'Point',
                    coordinates: [location.coordinates[0], location.coordinates[1]]
                },
                googleMap,
            }, { new: true });

            res.json({ ok: true, updatedAd });
        } catch (err) {
            console.log(err);
            res.status(500).json({
                error: "Update ad failed"
            });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Update ad failed",
        });
    }
};

export const deleteAd = async (req, res) => {
    try {
        const { slug } = req.params;

        // Find ad by slug and populate the postedBy field
        const ad = await Ad.findOne({ slug }).populate("postedBy", "_id");

        // Check if ad was found
        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }

        // Check if the logged-in user is the owner of the ad
        if (ad.postedBy && ad.postedBy._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Delete the ad
        await Ad.deleteOne({ slug });

        // Send success response
        res.json({ ok: true });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            error: "Delete ad failed",
        });
    }
};

export const userAds = async (req, res) => {
    try {
        const page = req.params.page ? req.params.page : 1;
        const pageSize = 2;
        const skip = (page - 1) * pageSize;
        const totalAds = await Ad.countDocuments({ postedBy: req.user._id });

        const ads = await Ad.find({ postedBy: req.user._id }) // current logged in user 
            .populate('postedBy', 'name username email phone company photo logo action')
            .select('-googleMap')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize);

        return res.json({
            ads,
            page,
            totalPages: Math.ceil(totalAds / pageSize),
        });
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to fetch. Try Again.",
        })
    }
};

export const updateAdStatus = async (req, res) => {
    try {
        const { slug } = req.params;
        const { status } = req.body;

        const ad = await Ad.findOne({ slug });

        // Check if ad was found
        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }

        // Check if the logged-in user is the owner of the ad
        if (ad.postedBy && ad.postedBy._id.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        ad.status = status;
        await ad.save();

        res.json({ ok: true });
        // res.json(ad);
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to update status. Try again.",
        });
    }
};

export const contactAgent = async (req, res) => {
    try {
        const { adId, message } = req.body;

        const ad = await Ad.findById(adId).populate("postedBy");
        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }

        const user = await User.findByIdAndUpdate(req.user_id, { // add ad to user's enquiredProperties list
            $addToSet: { enquiredProperties: adId },
        });

        //  send contact email to agent with user name phone message and ad link
        await sendContactEmailToAgent(ad, user, message);

        res.json({ ok: true });
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to fetch contact agent. Try again.",
        });
    }
};

export const enquiredAds = async (req, res) => {
    try {
        const page = req.params.page ? parseInt(req.params.page) : 1;
        const pageSize = 2;

        const skip = (page - 1) * pageSize;

        const user = await User.findById(req.user._id); //user.enquiredProperties [1,2,3]

        const totalAds = await Ad.countDocuments({
            _id: { $in: user.enquiredProperties }
        });

        const ads = await Ad.find({ _id: { $in: user.enquiredProperties } })
            .select('-googleMap')
            .populate('postedBy', 'name username email phone company photo logo')
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 });

        res.json({ ads, page, totalPages: Math.ceil(totalAds / pageSize) });
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to fetch. Try again"
        })
    }
};

export const toggleWishlist = async (req, res) => {
    try {
        const adId = req.params;
        const userId = req.user._id;

        // find the user
        const user = await User.findById(userId);

        // check if the adId is in the user's wishlist
        const isInWishlist = user.wishlist.includes(adId);

        // toggle wishlist
        const update = isInWishlist
            ? { $pull: { wishlist: adId } }
            : { $addToSet: { wishlist: adId } };

        const updatedUser = await User.findByIdAndUpdate(userId, update, {
            new: true
        });

        res.json({
            ok: true,
            message: isInWishlist
                ? "Ad removed from wishlist"
                : "Ad added to wishlist",
            wishlist: updatedUser.wishlist,
        });
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to toggle wishlist. Try again.",
        });
    }
};

export const wishlist = async (req, res) => {
    try {
        const page = req.params.page ? parseInt(req.params.page) : 1;
        const pageSize = 2;

        const skip = (page - 1) * pageSize;

        const user = await User.findById(req.user._id); // user.wishlist[1,2,3]

        const totalAds = await Ad.countDocuments({ _id: { $in: user.wishlist } });

        const ads = await Ad.find({ _id: { $in: user.wishlist } })
            .select('-googleMap')
            .populate('postedBy', 'name username email phone company photo logo')
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 });

        res.json({ ads, page, totalPages: Math.ceil(totalAds / pageSize) });
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to fetch user wishlist ad. Try again.",
        });
    }
};

export const searchAds = async (req, res) => {
    try {
        const {
            address,
            price,
            page = 1,
            action,
            propertyType,
            bedrooms,
            bathrooms
        } = req.body;

        const pageSize = 2; // Adjust as needed

        if (!address) {
            return res.status(400).json({ error: "Address is required" });
        }

        //  geocode the address to get coordinates
        let geo = await geocoderAddress(address);

        // function to check if a value is numeric
        const isNumeric = (value) => {
            return !isNaN(value) && !isNaN(parseFloat(value));
        };

        // construct the query object with all search parameters
        let query = { // published: true,           
            location: {
                $geoWithin: {
                    $centerSphere: [
                        [geo?.location?.coordinates[0], geo?.location?.coordinates[1]],
                        10 / 6378, // 10km radius, converted to radians
                    ],
                },
            },
        };

        if (action) {
            query.action = action;
        }
        if (propertyType && propertyType !== "All") {
            query.propertyType = propertyType;
        }
        if (bedrooms && bedrooms !== "All") {
            query.bedrooms = bedrooms;
        }
        if (bathrooms && bathrooms !== "All") {
            query.bathrooms = bathrooms;
        }

        // add price range filter to the query only if its a valid number
        if (isNumeric(price)) {
            const numericPrice = parseFloat(price);
            const minPrice = numericPrice * 0.8;
            const maxPrice = numericPrice * 1.2;

            query.price = {
                $regex: new RegExp(`^(${minPrice.toFixed(0)}|${maxPrice.toFixed(0)})`),
            };
        }

        let ads = await Ad.find(query)  // fetch ads matching all criteria, including price range
            .limit(pageSize)
            .skip((page - 1) * pageSize)
            .sort({ createdAt: -1 })
            .select("-googleMap")

        // count total matching ads for pagination
        const totalAds = await Ad.countDocuments(query);

        return res.json({ // return response with matching ads and pagination information
            ads,
            total: totalAds,
            page,
            totalPages: Math.ceil(totalAds / pageSize),
        });
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to search ads. Try again.",
        });
    }
};

// admin function
export const togglePublished = async (req, res) => {
    try {
        const { adId } = req.params;
        const ad = await Ad.findById(adId);

        // update the published status
        const updatedAd = await Ad.findByIdAndUpdate(adId, {
            published: ad.published ? false : true
        });

        res.json({
            ok: true,
            message: ad.published? "Ad unpublished": "Ad published",
            ad: updateAd,
        })
    } catch (err) {
        console.log(err);
        res.json({
            error: "Failed to toggle published. Try again",
        });
    }
};
