import mongoose, { Schema } from "mongoose";

// To keep subscriber data.
const subscriberSchema = new Schema({
  subcriber: {
    types: Schema.Types.ObjectId,
    ref: "User",
  },
});

// Subscription Schema
const subscriptionSchema = new Schema(
  {
    subscribers: {
      type: [subscriberSchema], //array - one who is subscribing.
    },
    channels: {
      types: Schema.Types.ObjectId, //getting subscribed by user
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
