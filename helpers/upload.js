import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { nanoid } from "nanoid";
import sharp from "sharp";

const client = new S3Client({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    apiVersion: process.env.AWS_API_VERSION,
});

const resizeImage = async (buffer) => {
    return sharp(buffer)
        .resize(1600, 900, { fit: 'inside', withoutEnlargement: true })
        .toBuffer();
};

const uploadToS3 = async (buffer, mimetype, uploadedBy) => {
    const metadata = await sharp(buffer).metadata();
    const fileExtension = metadata.format || 'jpg';

    const Key = `${nanoid()}.${fileExtension}`;
    const Location = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazomaws.com/${Key}`;

    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key,
        Body: buffer,
        ContentType: mimetype,
        //ACL: "public-read",
    };

    try {
        const command = new PutObjectCommand(params);
        await command.send(command);

        return { Key, Location, uploadedBy };
    } catch (err) {
        console.log("Upload to s3 error => ", err);
        throw new Error("Upload to s3 failed");
    }
}

export const uploadImageToS3 = async (files, uploadedBy) => {
    // map through the images
    const uploadPromises = files.map(async (file) => {
        // resize
        const resizedBuffer = await resizeImage(file.buffer);
        // upload
        return uploadToS3(resizedBuffer, file.mimetype, uploadedBy);
    });

    return Promise.all(uploadPromises);
};