-- Add brand_id column to shop_images
ALTER TABLE
    shop_images
ADD
    COLUMN brand_id INTEGER REFERENCES shop_brands(id) ON DELETE CASCADE;

-- Change product_id to be nullable
ALTER TABLE
    shop_images
ALTER COLUMN
    product_id DROP NOT NULL;

-- Add constraint to ensure either product_id or brand_id is specified
ALTER TABLE
    shop_images
ADD
    CONSTRAINT chk_shop_images_ref CHECK (
        (
            product_id IS NOT NULL
            AND brand_id IS NULL
        )
        OR (
            product_id IS NULL
            AND brand_id IS NOT NULL
        )
    );

-- Create a unique index for brand images to prevent duplicates
CREATE UNIQUE INDEX idx_shop_images_brand_path ON shop_images(brand_id, path)
WHERE
    brand_id IS NOT NULL;

-- Modify existing product_id index to account for NULL values
DROP INDEX IF EXISTS idx_shop_images_product_path;

CREATE UNIQUE INDEX idx_shop_images_product_path ON shop_images(product_id, path)
WHERE
    product_id IS NOT NULL;

-- Create index for faster brand image lookups
CREATE INDEX idx_shop_images_brand_id ON shop_images(brand_id);

-- Add comment explaining the dual-purpose nature of the table
COMMENT ON TABLE shop_images IS 'Stores images for both products and brands. Either product_id or brand_id must be specified, but not both.';