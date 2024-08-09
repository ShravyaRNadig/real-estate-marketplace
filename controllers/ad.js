import { uploadImageToS3, deleteImageFromS3 } from '../helpers/upload.js';
import { geocoderAddress } from '../helpers/google.js';
import Ad from "../models/ad.js";
import User from "../models/user.js";

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
                slug: `${propertyType}-for-${action}-address-${address}-price-${price}-${nanoid(
                    6
                )}`,
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
