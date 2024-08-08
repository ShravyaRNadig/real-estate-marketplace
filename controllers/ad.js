export const uploadImage = (req, res) => {
    try {
        console.log("Upload Image", req.files);
        if (!req.files || req.files === 0) {
            return res.json({
                error: "No Image Found",
            });
        }
        //  if only one file is uploaded, multer returns it as a simple object, not array
        const files = Array.isArray(req.files) ? req.files : [req.files];

        // upload image to s3
        const images = req.files.map((file) => {
            return {
                url: file.location,
                key: file.key
            }
        });
        res.json({ images });
    } catch (err) {
        console.log("upload Image error", err);
        res.json({
            error: "Upload Image failed",
        });
    }
}