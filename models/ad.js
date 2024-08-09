import mongoose from "mongoose";
const { Schema, ObjectId } = mongoose;

const adSchema = new Schema(
    {
        photos: [{}],
        price: {
            type: String,
            maxLength: 255,
            index: true,
        },
        address: {
            type: String,
            maxLength: 255,
            index: true,
        },
        propertyType: {
            type: String,
            default: "House",
            enum: ["House", "Apartment", "Townhouse", "Land", "Warehouse"],
        },
        bedrooms: Number,
        bathroom: Number,
        landsize: Number,
        landsizetype: String,
        carpark: Number,
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                default: [151.2077858, -33.862341],
            },
        },
        googleMap: {},
        title: {
            type: String,
            maxLength: 255,
        },
        slug: {
            type: String,
            lowercase: true,
            unique: true,
        },
        description: {},
        feztures: {},
        nearby: {},
        postedBy: { type: ObjectId, ref: "User" },
        published: { type: Boolean, default: true },
        action: {
            type: String,
            default: "Sell",
            enum: ["Sell", "Rent"],
        },
        views: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: [
                "In Market",
                "Deposit taken",
                "Under offer",
                "Contact agent",
                "Sold",
                "Rented",
                "Off market"
            ],
            default: "In Market",
        },
        inspectionTime: String,
    },
    { timestamps: true }
);

adSchema.index({ location: "2dsphere" });

export default mongoose.model("Ad", adSchema);
