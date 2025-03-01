// controllers/orderController.js
import Order from "../models/Order.js";

export async function getTopSellingProductByQuantity(req, res) {
  try {
    const result = await Order.aggregate([
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.productId",
          totalQuantity: { $sum: "$products.quantity" },
          productName: { $first: "$products.name" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 1 },
    ]);

    res.json(result.length ? result[0] : {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
