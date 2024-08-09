import { uploadImageToS3, deleteImageFromS3 } from '../helpers/upload.js';

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
            res.json({
                error: "Remove image failed",
            });
        }
    } catch (err) {
        res.json({
            error: "Remove Image failed",
        });
    }
};