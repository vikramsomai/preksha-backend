import mongoose from "mongoose";

const categorySchema = mongoose.Schema(
  {
    category: { type: String },
  },
  {
    collection: "category",
  }
);
const Category = mongoose.model("category", categorySchema);
export default Category;
