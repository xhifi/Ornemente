-- Enable UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================
-- Trigger Function for updated_at
-- ========================
CREATE
OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $ $ BEGIN NEW.updated_at = NOW();

RETURN NEW;

END;

$ $ language 'plpgsql';

-- ========================
-- Slugify Function
-- ========================
CREATE
OR REPLACE FUNCTION slugify(input_text TEXT) RETURNS TEXT AS $ $ DECLARE result TEXT;

BEGIN -- Convert to lowercase
result := LOWER(input_text);

-- Replace spaces and special characters with hyphens
-- First replace spaces
result := REGEXP_REPLACE(result, '\s+', '-', 'g');

-- Then replace other non-alphanumeric characters
result := REGEXP_REPLACE(result, '[^a-z0-9\-]', '', 'g');

-- Remove any duplicate hyphens
result := REGEXP_REPLACE(result, '\-+', '-', 'g');

-- Remove leading and trailing hyphens
result := TRIM(
    BOTH '-'
    FROM
        result
);

RETURN result;

END;

$ $ LANGUAGE plpgsql;

-- ========================
-- Users Table
-- ========================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ========================
-- shop_sexes
-- ========================
CREATE TABLE shop_sexes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

ALTER SEQUENCE shop_sexes_id_seq RESTART WITH 11;

-- ========================
-- shop_types
-- ========================
CREATE TABLE shop_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

ALTER SEQUENCE shop_types_id_seq RESTART WITH 21;

-- ========================
-- shop_collections
-- ========================
CREATE TABLE shop_collections (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

ALTER SEQUENCE shop_collections_id_seq RESTART WITH 11;

-- ========================
-- shop_brands
-- ========================
CREATE TABLE shop_brands (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

ALTER SEQUENCE shop_brands_id_seq RESTART WITH 101;

-- ========================
-- shop_fabrics
-- ========================
CREATE TABLE shop_fabrics (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

ALTER SEQUENCE shop_fabrics_id_seq RESTART WITH 1;

-- ========================
-- shop_colors
-- ========================
CREATE TABLE shop_colors (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    hex TEXT [] NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

ALTER SEQUENCE shop_colors_id_seq RESTART WITH 1;

-- ========================
-- shop_sizes
-- ========================
CREATE TABLE shop_sizes (
    code VARCHAR(10) PRIMARY KEY,
    label TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- First add the slug column to shop_sizes
ALTER TABLE
    shop_sizes
ADD
    COLUMN slug TEXT UNIQUE;

-- ========================
-- shop_products
-- ========================
CREATE TABLE shop_products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tagline TEXT,
    sex INTEGER REFERENCES shop_sexes(id),
    type INTEGER REFERENCES shop_types(id),
    collection INTEGER REFERENCES shop_collections(id),
    brand INTEGER REFERENCES shop_brands(id),
    original_price INT NULL,
    -- Changed to allow NULL values for price
    discount INT DEFAULT 0,
    publish_status TEXT DEFAULT 'draft' CHECK (publish_status IN ('draft', 'published')),
    note TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

ALTER SEQUENCE shop_products_id_seq RESTART WITH 1000000;

-- ========================
-- shop_pieces
-- ========================
CREATE TABLE shop_pieces (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES shop_products(id),
    name TEXT NOT NULL,
    description TEXT,
    fabric INTEGER REFERENCES shop_fabrics(id),
    color INTEGER REFERENCES shop_colors(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

ALTER SEQUENCE shop_pieces_id_seq RESTART WITH 41;

ALTER TABLE
    shop_pieces DROP CONSTRAINT shop_pieces_product_id_unique;

-- ========================
-- shop_product_sizes
-- ========================
CREATE TABLE shop_product_sizes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES shop_products(id),
    size_id VARCHAR(10) REFERENCES shop_sizes(code),
    stock INT NOT NULL DEFAULT 0,
    sku VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

ALTER TABLE
    shop_product_sizes
ADD
    CONSTRAINT shop_product_sizes_product_id_size_id_unique UNIQUE (product_id, size_id);

-- ========================
-- shop_designs
-- ========================
CREATE TABLE shop_designs (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ========================
-- shop_product_designs
-- ========================
CREATE TABLE shop_product_designs (
    product_id INTEGER REFERENCES shop_products(id),
    design_id INTEGER REFERENCES shop_designs(id),
    PRIMARY KEY (product_id, design_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- ========================
-- shop_images
-- ========================
CREATE TABLE shop_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id INTEGER NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    -- Path to the image in the bucket (including folder structure)
    key TEXT NOT NULL,
    -- Unique key/identifier in storage
    name TEXT,
    -- Optional display name for the image
    selected BOOLEAN DEFAULT FALSE,
    -- Whether this image is selected as a primary/display image
    position INTEGER DEFAULT 0,
    -- For ordering images (display order)
    mime_type TEXT,
    -- Store the MIME type (e.g., image/jpeg)
    size INTEGER,
    -- Size in bytes
    width INTEGER,
    -- Image width in pixels
    height INTEGER,
    -- Image height in pixels
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Create a unique index on product_id and path to prevent duplicate images
CREATE UNIQUE INDEX idx_shop_images_product_path ON shop_images(product_id, path);

-- Create indexes for efficient querying
CREATE INDEX idx_shop_images_product_id ON shop_images(product_id);

CREATE INDEX idx_shop_images_selected ON shop_images(product_id, selected);

-- REMOVED: Previous constraint that only allowed one selected image per product
-- Now multiple images can be selected=true for each product
-- We'll still keep track of image selection changes for auditing purposes
CREATE
OR REPLACE FUNCTION log_image_selection_change() RETURNS TRIGGER AS $ $ BEGIN -- This is just a placeholder for any logic you might want when selection changes
-- For example, you could log the change or perform some validation
-- The function now just returns the NEW record without modifying other images
RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Create the trigger that executes before insert or update
CREATE TRIGGER trg_log_image_selection_change BEFORE
INSERT
    OR
UPDATE
    OF selected ON shop_images FOR EACH ROW EXECUTE FUNCTION log_image_selection_change();

-- Trigger to update position values if not specified
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

-- Create the trigger that executes before insert
CREATE TRIGGER trg_set_image_position BEFORE
INSERT
    ON shop_images FOR EACH ROW EXECUTE FUNCTION set_image_position();

-- REMOVED: Function to ensure at least one image is selected
-- This was removed to allow products without any images to be created
-- Now products can exist without any images, and images can be added later as needed
-- ========================
-- Triggers for slug generation
-- ========================
-- Trigger for shop_sexes
CREATE
OR REPLACE FUNCTION set_shop_sexes_slug() RETURNS TRIGGER AS $ $ BEGIN NEW.slug := slugify(NEW.name);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_shop_sexes_slug BEFORE
INSERT
    ON shop_sexes FOR EACH ROW EXECUTE FUNCTION set_shop_sexes_slug();

-- Trigger for shop_types
CREATE
OR REPLACE FUNCTION set_shop_types_slug() RETURNS TRIGGER AS $ $ BEGIN NEW.slug := slugify(NEW.name);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_shop_types_slug BEFORE
INSERT
    ON shop_types FOR EACH ROW EXECUTE FUNCTION set_shop_types_slug();

-- Trigger for shop_collections
CREATE
OR REPLACE FUNCTION set_shop_collections_slug() RETURNS TRIGGER AS $ $ BEGIN NEW.slug := slugify(NEW.name);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_shop_collections_slug BEFORE
INSERT
    ON shop_collections FOR EACH ROW EXECUTE FUNCTION set_shop_collections_slug();

-- Trigger for shop_brands
CREATE
OR REPLACE FUNCTION set_shop_brands_slug() RETURNS TRIGGER AS $ $ BEGIN NEW.slug := slugify(NEW.name);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_shop_brands_slug BEFORE
INSERT
    ON shop_brands FOR EACH ROW EXECUTE FUNCTION set_shop_brands_slug();

-- Trigger for shop_fabrics
CREATE
OR REPLACE FUNCTION set_shop_fabrics_slug() RETURNS TRIGGER AS $ $ BEGIN NEW.slug := slugify(NEW.name);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_shop_fabrics_slug BEFORE
INSERT
    ON shop_fabrics FOR EACH ROW EXECUTE FUNCTION set_shop_fabrics_slug();

-- Trigger for shop_colors
CREATE
OR REPLACE FUNCTION set_shop_colors_slug() RETURNS TRIGGER AS $ $ BEGIN NEW.slug := slugify(NEW.name);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_shop_colors_slug BEFORE
INSERT
    ON shop_colors FOR EACH ROW EXECUTE FUNCTION set_shop_colors_slug();

-- Trigger for shop_designs
CREATE
OR REPLACE FUNCTION set_shop_designs_slug() RETURNS TRIGGER AS $ $ BEGIN NEW.slug := slugify(NEW.name);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_shop_designs_slug BEFORE
INSERT
    ON shop_designs FOR EACH ROW EXECUTE FUNCTION set_shop_designs_slug();

-- Trigger for shop_sizes - uses code column
CREATE
OR REPLACE FUNCTION set_shop_sizes_slug() RETURNS TRIGGER AS $ $ BEGIN NEW.slug := slugify(NEW.code);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trg_shop_sizes_slug BEFORE
INSERT
    ON shop_sizes FOR EACH ROW EXECUTE FUNCTION set_shop_sizes_slug();

-- ========================
-- Triggers for updated_at
-- ========================
DO $ $ DECLARE tbl TEXT;

BEGIN FOR tbl IN
SELECT
    table_name
FROM
    information_schema.tables
WHERE
    table_schema = 'public'
    AND table_type = 'BASE TABLE' LOOP EXECUTE format(
        '
            CREATE TRIGGER trg_%s_updated_at
            BEFORE UPDATE ON %I
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        ',
        tbl,
        tbl
    );

END LOOP;

END $ $;

-- ========================
-- Trigger for sku in shop_product_sizes
-- ========================
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

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS generate_product_size_sku_trigger ON shop_product_sizes;

-- Create the trigger that executes before insert
CREATE TRIGGER generate_product_size_sku_trigger BEFORE
INSERT
    ON shop_product_sizes FOR EACH ROW EXECUTE FUNCTION generate_sku_for_product_size();

-- ========================
-- Trigger to update SKUs when product is published
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

-- Create the trigger for product publishing
CREATE TRIGGER trg_update_skus_on_product_publish
AFTER
UPDATE
    OF publish_status ON shop_products FOR EACH ROW EXECUTE FUNCTION update_skus_on_product_publish();

-- ========================
-- Indexes (additional to PKs)
-- ========================
CREATE INDEX idx_shop_products_sex ON shop_products(sex);

CREATE INDEX idx_shop_products_type ON shop_products(type);

CREATE INDEX idx_shop_products_collection ON shop_products(collection);

CREATE INDEX idx_shop_products_brand ON shop_products(brand);

CREATE INDEX idx_shop_product_sizes_product_id ON shop_product_sizes(product_id);

CREATE INDEX idx_shop_product_sizes_size_id ON shop_product_sizes(size_id);

CREATE INDEX idx_shop_product_designs_design_id ON shop_product_designs(design_id);

-- Create indexes for slug columns
CREATE INDEX idx_shop_sexes_slug ON shop_sexes(slug);

CREATE INDEX idx_shop_types_slug ON shop_types(slug);

CREATE INDEX idx_shop_collections_slug ON shop_collections(slug);

CREATE INDEX idx_shop_brands_slug ON shop_brands(slug);

CREATE INDEX idx_shop_fabrics_slug ON shop_fabrics(slug);

CREATE INDEX idx_shop_colors_slug ON shop_colors(slug);

CREATE INDEX idx_shop_designs_slug ON shop_designs(slug);

CREATE INDEX idx_shop_sizes_slug ON shop_sizes(slug);

-- ========================
-- INITIAL DATA INSERTS
-- ========================
INSERT INTO
    shop_sexes(name)
VALUES
    ('men'),
    ('women'),
    ('unisex'),
    ('kids');

INSERT INTO
    shop_sizes(code)
VALUES
    ('XS'),
    ('S'),
    ('M'),
    ('L'),
    ('XL'),
    ('XXL'),
    ('XS/S'),
    ('M/L'),
    ('XL/XXL');

INSERT INTO
    shop_brands(name)
VALUES
    ('Nishat'),
    ('JDot'),
    ('Alkaram'),
    ('Gul Ahmed'),
    ('Khaadi'),
    ('Sapphire'),
    ('Edenrobe'),
    ('Outfitters'),
    ('Almirah');

INSERT INTO
    shop_types(name)
VALUES
    ('none'),
    ('Stitched'),
    ('Un-stitched'),
    ('Dress'),
    ('Ready to wear'),
    ('Pret');

INSERT INTO
    shop_designs(name)
VALUES
    ('none'),
    ('embroidered'),
    ('printed'),
    ('digital-printed'),
    ('plain'),
    ('dyed');

INSERT INTO
    shop_collections(name)
VALUES
    ('Summer Collection'),
    ('Winter Collection'),
    ('Eid Collection'),
    ('Bridal Collection'),
    ('Festive Collection');

INSERT INTO
    shop_fabrics(name)
VALUES
    ('Cotton'),
    ('Lawn'),
    ('Silk'),
    ('Chiffon'),
    ('Georgette'),
    ('Linen'),
    ('Velvet'),
    ('Wool');

INSERT INTO
    shop_colors(name)
VALUES
    ('Red'),
    ('Blue'),
    ('Green'),
    ('Black'),
    ('White'),
    ('Yellow'),
    ('Pink'),
    ('Purple'),
    ('Orange');

-- ========================
-- Update existing records with slugs
-- ========================
-- This section is typically needed only for migrations
-- but we include it to ensure any existing records have slugs
UPDATE
    shop_sexes
SET
    slug = slugify(name)
WHERE
    slug IS NULL;

UPDATE
    shop_types
SET
    slug = slugify(name)
WHERE
    slug IS NULL;

UPDATE
    shop_collections
SET
    slug = slugify(name)
WHERE
    slug IS NULL;

UPDATE
    shop_brands
SET
    slug = slugify(name)
WHERE
    slug IS NULL;

UPDATE
    shop_fabrics
SET
    slug = slugify(name)
WHERE
    slug IS NULL;

UPDATE
    shop_colors
SET
    slug = slugify(name)
WHERE
    slug IS NULL;

UPDATE
    shop_designs
SET
    slug = slugify(name)
WHERE
    slug IS NULL;

UPDATE
    shop_sizes
SET
    slug = slugify(code)
WHERE
    slug IS NULL;

-- ========================
-- No sequence needed for shop_images (using UUID)
-- ========================
-- shop_images table now uses UUID primary keys instead of SERIAL
-- ========================
-- Notes on shop_images selection
-- ========================
-- The shop_images table allows multiple images to be marked as selected=true for each product.
-- Products can exist without any images, and images can be added later as needed.
-- When images are added, their 'selected' status can be set manually to control which images
-- should be displayed for the product.
-- ========================
-- Notes on product publishing and SKUs
-- ========================
-- The shop_products table has a publish_status field that can be either 'draft' or 'published'.
-- New products start as 'draft', which allows them to be created with just a name initially.
-- SKUs are only generated when a product's status is changed to 'published'.
-- This ensures that SKUs are generated only after all required product information has been filled in.
-- When a product's status changes from 'draft' to 'published', all related SKUs are generated automatically.