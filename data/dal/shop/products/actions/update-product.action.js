"use server";
import updateProductSchema from "@/data/dal/schema/update-product-schema";
import updateProduct from "../update-product";
import validateAction from "@/lib/validate-action";

// usage
const updateProductAction = async (data) => {
  console.log(`UPDATE PRODUCT ACTION`, data);

  try {
    // Call the actual update product function with validated data
    const result = await updateProduct(data);
    return {
      ok: true,
      data: result,
      error: null,
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      ok: false,
      data: null,
      error: error.message || "Unknown error occurred while updating product",
      inputs: data,
    };
  }
};

export default updateProductAction;
