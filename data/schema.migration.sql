-- Migration script for schema updates
-- Latest changes: product publish_status, UUID for shop_images, improved SKU generation
-- Date: July 19, 2025
-- Start a transaction for safety
BEGIN;

-- Ensure UUID extension is available (must be done outside of any DO block)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- 1. Add publish_status to shop_products
-- ========================
DO $ $ BEGIN -- Check if publish_status column exists in shop_products
IF NOT EXISTS (
    SELECT
        1
    FROM
        information_schema.columns
    WHERE
        table_name = 'shop_products'
        AND column_name = 'publish_status'
) THEN -- Add publish_status column
ALTER TABLE
    shop_products
ADD
    COLUMN publish_status TEXT DEFAULT 'draft';

-- Add check constraint
ALTER TABLE
    shop_products
ADD
    CONSTRAINT chk_publish_status CHECK (publish_status IN ('draft', 'published'));

-- Update existing products to be published
UPDATE
    shop_products
SET
    publish_status = 'published';

RAISE NOTICE 'Added publish_status column to shop_products';

ELSE RAISE NOTICE 'publish_status column already exists in shop_products';

END IF;

END $ $;

-- ========================
-- 2. Update shop_images table to use UUID
-- ========================
DO $ $ BEGIN -- Check if shop_images table exists with SERIAL id
IF EXISTS (
    SELECT
        1
    FROM
        information_schema.columns
    WHERE
        table_name = 'shop_images'
        AND column_name = 'id'
        AND data_type != 'uuid'
) THEN -- Create a backup of the shop_images table if it exists
CREATE TABLE shop_images_backup AS
SELECT
    *
FROM
    shop_images;

-- Drop the old table and constraints
DROP TABLE shop_images CASCADE;

-- Create the new table with UUID primary key
CREATE TABLE shop_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    key TEXT NOT NULL,
    name TEXT,
    selected BOOLEAN DEFAULT FALSE,
    position INTEGER DEFAULT 0,
    mime_type TEXT,
    size INTEGER,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Insert the data from backup, generating new UUIDs
INSERT INTO
    shop_images (
        product_id,
        path,
        key,
        name,
        selected,
        position,
        mime_type,
        size,
        width,
        height,
        created_at,
        updated_at,
        created_by,
        updated_by
    )
SELECT
    product_id,
    path,
    key,
    COALESCE(name, ''),
    COALESCE(selected, FALSE),
    COALESCE(position, 0),
    mime_type,
    size,
    width,
    height,
    created_at,
    updated_at,
    created_by,
    updated_by
FROM
    shop_images_backup;

-- Drop the backup table
DROP TABLE shop_images_backup;

-- Re-create indexes
CREATE UNIQUE INDEX idx_shop_images_product_path ON shop_images(product_id, path);

CREATE INDEX idx_shop_images_product_id ON shop_images(product_id);

CREATE INDEX idx_shop_images_selected ON shop_images(product_id, selected);

RAISE NOTICE 'Converted shop_images table from SERIAL to UUID primary key';

ELSE RAISE NOTICE 'shop_images table already has UUID primary key or does not exist';

END IF;

END $ $;

-- ========================
-- 3. Update SKU generation function to handle publish_status
-- ========================
-- Create or update function for SKU generation
CREATE
OR REPLACE FUNCTION generate_sku_for_product_size() RETURNS TRIGGER AS $ $ DECLARE v_sex_id INTEGER;

v_type_id INTEGER;

v_brand_id INTEGER;

v_publish_status TEXT;

BEGIN -- Get the required IDs and publish status from the product table
SELECT
    p.sex,
    p.type,
    p.brand,
    p.publish_status INTO v_sex_id,
    v_type_id,
    v_brand_id,
    v_publish_status
FROM
    shop_products p
WHERE
    p.id = NEW.product_id;

-- Only generate SKU if the product is published
IF v_publish_status = 'published' THEN -- Generate the SKU in format: {sex_id}{type_id}{brand_id}{size_id}-{product_id}
-- At this point the product should have all required values since it's published
NEW.sku = CONCAT(
    COALESCE(v_sex_id :: TEXT, '0'),
    COALESCE(v_type_id :: TEXT, '0'),
    COALESCE(v_brand_id :: TEXT, '0'),
    NEW.size_id,
    '-',
    NEW.product_id :: TEXT
);

ELSE -- For draft products, don't generate a SKU yet
NEW.sku = NULL;

END IF;

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS generate_product_size_sku_trigger ON shop_product_sizes;

-- Create the trigger for new product size records
CREATE TRIGGER generate_product_size_sku_trigger BEFORE
INSERT
    ON shop_product_sizes FOR EACH ROW EXECUTE FUNCTION generate_sku_for_product_size();

-- ========================
-- 4. Create function to update SKUs when product is published
-- ========================
CREATE
OR REPLACE FUNCTION update_skus_on_product_publish() RETURNS TRIGGER AS $ $ BEGIN -- If product status changed to published, update all related SKUs
IF NEW.publish_status = 'published'
AND (
    OLD.publish_status IS NULL
    OR OLD.publish_status = 'draft'
) THEN
UPDATE
    shop_product_sizes
SET
    sku = CONCAT(
        COALESCE(NEW.sex :: TEXT, '0'),
        COALESCE(NEW.type :: TEXT, '0'),
        COALESCE(NEW.brand :: TEXT, '0'),
        size_id,
        '-',
        NEW.id :: TEXT
    )
WHERE
    product_id = NEW.id;

END IF;

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Create trigger for product publishing
DROP TRIGGER IF EXISTS trg_update_skus_on_product_publish ON shop_products;

CREATE TRIGGER trg_update_skus_on_product_publish
AFTER
UPDATE
    OF publish_status ON shop_products FOR EACH ROW EXECUTE FUNCTION update_skus_on_product_publish();

-- ========================
-- 5. Update position function for images (no minimum selection enforced)
-- ========================
CREATE
OR REPLACE FUNCTION set_image_position() RETURNS TRIGGER AS $ $ BEGIN -- If position is not specified or is 0, assign the next available position
IF NEW.position IS NULL
OR NEW.position = 0 THEN
SELECT
    COALESCE(MAX(position), 0) + 10 INTO NEW.position
FROM
    shop_images
WHERE
    product_id = NEW.product_id;

END IF;

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Create the trigger for image positions
DROP TRIGGER IF EXISTS trg_set_image_position ON shop_images;

CREATE TRIGGER trg_set_image_position BEFORE
INSERT
    ON shop_images FOR EACH ROW EXECUTE FUNCTION set_image_position();

-- ========================
-- 6. Create image selection tracking function (simple placeholder)
-- ========================
CREATE
OR REPLACE FUNCTION log_image_selection_change() RETURNS TRIGGER AS $ $ BEGIN -- This is just a placeholder for any logic you might want when selection changes
-- For example, you could log the change or perform some validation
-- The function now just returns the NEW record without modifying other images
RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Create trigger for image selection changes
DROP TRIGGER IF EXISTS trg_log_image_selection_change ON shop_images;

CREATE TRIGGER trg_log_image_selection_change BEFORE
INSERT
    OR
UPDATE
    OF selected ON shop_images FOR EACH ROW EXECUTE FUNCTION log_image_selection_change();

-- Drop any old image management triggers that are no longer needed
DROP TRIGGER IF EXISTS trg_ensure_minimum_one_selected_image ON shop_images;

DROP TRIGGER IF EXISTS trg_enforce_single_selected_image ON shop_images;

DROP FUNCTION IF EXISTS ensure_minimum_one_selected_image() CASCADE;

DROP FUNCTION IF EXISTS enforce_single_selected_image() CASCADE;

-- ========================
-- 7. Set up updated_at trigger for shop_images
-- ========================
DO $ $ BEGIN IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_trigger
    WHERE
        tgname = 'trg_shop_images_updated_at'
        AND tgrelid = 'shop_images' :: regclass
) THEN EXECUTE 'CREATE TRIGGER trg_shop_images_updated_at
                 BEFORE UPDATE ON shop_images
                 FOR EACH ROW
                 EXECUTE FUNCTION update_updated_at_column();';

RAISE NOTICE 'Added updated_at trigger for shop_images';

END IF;

END $ $;

-- ========================
-- 8. Update existing images
-- ========================
-- Mark any existing images that don't have selected status as selected
UPDATE
    shop_images
SET
    selected = TRUE
WHERE
    selected IS NULL
    OR selected = FALSE;

DO $ $ BEGIN RAISE NOTICE 'Updated existing images to be selected by default';

END $ $;

-- ========================
-- 9. Create index for shop_products.publish_status
-- ========================
DO $ $ BEGIN -- Create an index on the publish_status column for faster filtering
IF NOT EXISTS (
    SELECT
        1
    FROM
        pg_indexes
    WHERE
        tablename = 'shop_products'
        AND indexname = 'idx_shop_products_publish_status'
) THEN CREATE INDEX idx_shop_products_publish_status ON shop_products(publish_status);

RAISE NOTICE 'Created index on shop_products.publish_status';

ELSE RAISE NOTICE 'Index on shop_products.publish_status already exists';

END IF;

END $ $;

-- ========================
-- 10. Update SKUs for existing published products
-- ========================
DO $ $ BEGIN -- Update shop_products table - set existing products to published if null
UPDATE
    shop_products
SET
    publish_status = 'published'
WHERE
    publish_status IS NULL;

-- Reset any NULL SKUs for published products
UPDATE
    shop_product_sizes ps
SET
    sku = CONCAT(
        COALESCE(
            (
                SELECT
                    sex
                FROM
                    shop_products
                WHERE
                    id = ps.product_id
            ) :: TEXT,
            '0'
        ),
        COALESCE(
            (
                SELECT
                    type
                FROM
                    shop_products
                WHERE
                    id = ps.product_id
            ) :: TEXT,
            '0'
        ),
        COALESCE(
            (
                SELECT
                    brand
                FROM
                    shop_products
                WHERE
                    id = ps.product_id
            ) :: TEXT,
            '0'
        ),
        ps.size_id,
        '-',
        ps.product_id :: TEXT
    )
FROM
    shop_products p
WHERE
    ps.product_id = p.id
    AND p.publish_status = 'published'
    AND ps.sku IS NULL;

RAISE NOTICE 'Updated existing product status and SKUs';

END $ $;

-- ========================
-- 11. Set document comments
-- ========================
COMMENT ON TABLE shop_images IS 'Stores product image information and selection status';

COMMENT ON COLUMN shop_images.path IS 'Path to the image in the bucket (including folder structure)';

COMMENT ON COLUMN shop_images.key IS 'Unique key/identifier in storage';

COMMENT ON COLUMN shop_images.name IS 'Optional display name for the image';

COMMENT ON COLUMN shop_images.selected IS 'Whether this image is selected as a product image';

COMMENT ON COLUMN shop_images.position IS 'For ordering images (display order)';

COMMENT ON COLUMN shop_images.mime_type IS 'Store the MIME type (e.g., image/jpeg)';

COMMENT ON COLUMN shop_images.size IS 'Size in bytes';

COMMENT ON COLUMN shop_images.width IS 'Image width in pixels';

COMMENT ON COLUMN shop_images.height IS 'Image height in pixels';

COMMENT ON COLUMN shop_products.publish_status IS 'Product status: draft (initial creation) or published (ready for sale)';

-- ========================
-- Migration completed
-- ========================
DO $ $ BEGIN RAISE NOTICE '-----------------------------------';

RAISE NOTICE 'Migration completed successfully';

RAISE NOTICE 'Updates:';

RAISE NOTICE '  - Added publish_status to products';

RAISE NOTICE '  - Updated shop_images to use UUID';

RAISE NOTICE '  - Updated SKU generation to respect publish status';

RAISE NOTICE '-----------------------------------';

END $ $;

-- Commit the transaction
COMMIT;