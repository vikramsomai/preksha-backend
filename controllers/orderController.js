import Order from "../models/Order.js";

export async function getTopSellingProductByQuantity(req, res) {
  try {
    console.log("Fetching top-selling product...");

    // Check if any orders exist
    const ordersCount = await Order.countDocuments();
    console.log("Total Orders in DB:", ordersCount);

    if (ordersCount === 0) {
      return res.status(404).json({ message: "No orders found." });
    }

    // Run the aggregation query
    const result = await Order.aggregate([
      {
        $unwind: "$products",
      },
      {
        $group: {
          _id: "$products.productId",
          totalSold: {
            $sum: "$products.quantity",
          },
          productName: {
            $first: "$products.name",
          },
        },
      },
      {
        $sort: {
          totalSold: -1,
        },
      },
      {
        $limit: 1,
      },
    ]);

    console.log("Aggregation Result:", result);

    if (result.length === 0) {
      return res.status(404).json({ message: "No top-selling product found." });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: error.message });
  }
}
