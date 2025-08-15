"use server";

/**
 * This function exists only for compatibility purposes.
 * According to the database schema, designs don't have images.
 * The relationship between products and designs is managed through the
 * shop_product_designs junction table. The shop_designs table doesn't have
 * a direct relationship with shop_images.
 */
const saveDesignImage = async () => {
  throw new Error("Designs don't support image uploads according to the database schema");
};

export default saveDesignImage;
