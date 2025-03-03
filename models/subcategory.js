import mongoose from "mongoose";

const categorySchema = mongoose.Schema(
  {
    category: { type: String },
  },
  {
    collection: "subcategory",
  }
);
const SubCategory = mongoose.model("SubCategory", categorySchema);
export default SubCategory;
