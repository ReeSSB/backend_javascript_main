import mongoose, { Schema } from "mongoose";

// To keep subscriber data.
// const subscriberSchema = new Schema({
//   subscriber: {
//     types: Schema.Types.ObjectId,
//     ref: "User",
//   },
// });

// Subscription Schema
const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, //array - one who is subscribing.
      ref: "User",
    },
    channel: {
      types: Schema.Types.ObjectId, //getting subscribed by user
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
