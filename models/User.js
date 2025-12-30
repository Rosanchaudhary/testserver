import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  isGuest: { type: Boolean, default: true },
  name: { type: String },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", UserSchema);
export default User;
