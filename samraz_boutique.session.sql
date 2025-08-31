INSERT INTO
    shop_sexes(name)
VALUES
    ('men'),
    ('women'),
    ('unisex'),
    ('kids');

INSERT INTO
    shop_types(name)
VALUES
    ('Stitched'),
    ('Un-stitched'),
    ('Dress'),
    ('Ready to wear'),
    ('Pret');

INSERT INTO
    shop_designs(name)
VALUES
    ('Embroidered'),
    ('Printed'),
    ('Digital Printed'),
    ('Plain'),
    ('Dyed');

INSERT INTO
    shop_collections(name)
VALUES
    ('Summer Collection'),
    ('Winter Collection'),
    ('Eid Collection'),
    ('Bridal Collection'),
    ('Festive Collection');

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

INSERT INTO
    shop_sizes(code)
VALUES
    ('STD'),
    ('XS'),
    ('S'),
    ('M'),
    ('L'),
    ('XL'),
    ('XXL'),
    ('XS/S'),
    ('M/L'),
    ('XL/XXL');

SELECT
    *
FROM
    shop_sexes;

SELECT
    *
FROM
    shop_types;

SELECT
    *
FROM
    shop_designs;

SELECT
    *
FROM
    shop_product_designs;

SELECT
    *
FROM
    shop_collections;

SELECT
    *
FROM
    shop_brands;

SELECT
    *
FROM
    shop_colors;

SELECT
    *
FROM
    shop_sizes;

SELECT
    *
FROM
    shop_product_sizes;

SELECT
    *
FROM
    shop_fabrics;

SELECT
    *
FROM
    shop_products;

INSERT INTO
    shop_products(
        name,
        description,
        tagline,
        sex,
        type,
        brand,
        original_price,
        discount,
        note
    )
VALUES
    (
        'Printed Embroidered Suit',
        'A digital dream brought to life this printed embroidered two-piece from our latest Summer Collection blends vibrant prints and delicate embroidery for a look that’s bold, elegant, and effortlessly stylish.',
        'Abstract Floral Style Shirt with Trouser',
        12,
        23,
        101,
        6490,
        7,
        'Sizes may vary, please refer to the size chart before ordering.'
    );

SELECT
    *
FROM
    shop_products;

INSERT INTO
    shop_product_designs(product_id, design_id)
VALUES
    (1000000, 2),
    (1000000, 6),
    (1000001, 3),
    (1000001, 2);

INSERT INTO
    shop_product_sizes(product_id, size_id, stock)
VALUES
    (1000001, 'XS/S', 50),
    (1000001, 'M/L', 33),
    (1000001, 'XL/XXL', 26),
    (1000000, 'XS', 50),
    (1000000, 'S', 33),
    (1000000, 'M', 26),
    (1000000, 'L', 11),
    (1000000, 'XL', 8),
    (1000000, 'XXL', 24);

-- Comprehensive query to fetch all product data with related information
-- Using JSON for sizes data for easy serialization
SELECT
    p.id AS product_id,
    p.name AS product_name,
    p.description,
    p.tagline,
    p.original_price,
    p.discount,
    p.note,
    -- Calculate discounted price
    ROUND(
        p.original_price - (p.original_price * p.discount / 100)
    ) AS discounted_price,
    -- Related information
    s.id AS sex_id,
    s.name AS sex,
    t.id AS type_id,
    t.name AS product_type,
    b.id AS brand_id,
    b.name AS brand,
    -- Aggregate designs (multiple designs per product)
    STRING_AGG(DISTINCT d.name, ', ') AS designs,
    -- Aggregate sizes with stock information as JSON
    jsonb_agg(
        jsonb_build_object(
            'size',
            sz.code,
            'stock',
            ps.stock,
            'sku',
            COALESCE(
                ps.sku,
                CONCAT(s.id, t.id, b.id, sz.code, '-', p.id)
            )
        )
    ) AS sizes_json,
    -- Total stock across all sizes
    SUM(ps.stock) AS total_stock
FROM
    shop_products p -- Join related tables
    LEFT JOIN shop_sexes s ON p.sex = s.id
    LEFT JOIN shop_types t ON p.type = t.id
    LEFT JOIN shop_brands b ON p.brand = b.id -- Join for designs (many-to-many)
    LEFT JOIN shop_product_designs pd ON p.id = pd.product_id
    LEFT JOIN shop_designs d ON pd.design_id = d.id -- Join for sizes (many-to-many with stock)
    LEFT JOIN shop_product_sizes ps ON p.id = ps.product_id
    LEFT JOIN shop_sizes sz ON ps.size_id = sz.code
GROUP BY
    p.id,
    p.name,
    p.description,
    p.tagline,
    p.original_price,
    p.discount,
    p.note,
    s.id,
    s.name,
    t.id,
    t.name,
    b.id,
    b.name
ORDER BY
    p.id;

-- First, add an SKU column to shop_product_sizes if it doesn't exist
ALTER TABLE
    shop_product_sizes
ADD
    COLUMN IF NOT EXISTS sku VARCHAR(50);

-- Create a function that will be used by the trigger
CREATE
OR REPLACE FUNCTION generate_sku_for_product_size() RETURNS TRIGGER AS $ $ DECLARE v_sex_id INTEGER;

v_type_id INTEGER;

v_brand_id INTEGER;

BEGIN -- Get the required IDs from the product table
SELECT
    p.sex,
    p.type,
    p.brand INTO v_sex_id,
    v_type_id,
    v_brand_id
FROM
    shop_products p
WHERE
    p.id = NEW.product_id;

-- Generate the SKU in format: {sex_id}{type_id}{brand_id}{size_id}-{product_id}
NEW.sku = CONCAT(
    v_sex_id :: TEXT,
    v_type_id :: TEXT,
    v_brand_id :: TEXT,
    NEW.size_id,
    '-',
    NEW.product_id :: TEXT
);

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Drop the trigger if it already exists
DROP TRIGGER IF EXISTS generate_product_size_sku_trigger ON shop_product_sizes;

-- Create the trigger that executes before insert
CREATE TRIGGER generate_product_size_sku_trigger BEFORE
INSERT
    ON shop_product_sizes FOR EACH ROW EXECUTE FUNCTION generate_sku_for_product_size();

-- Update existing records to have SKUs
UPDATE
    shop_product_sizes ps
SET
    sku = CONCAT(
        (
            SELECT
                sex
            FROM
                shop_products
            WHERE
                id = ps.product_id
        ) :: TEXT,
        (
            SELECT
                type
            FROM
                shop_products
            WHERE
                id = ps.product_id
        ) :: TEXT,
        (
            SELECT
                brand
            FROM
                shop_products
            WHERE
                id = ps.product_id
        ) :: TEXT,
        ps.size_id,
        '-',
        ps.product_id :: TEXT
    )
WHERE
    ps.sku IS NULL;

-- Let's test the trigger with a new insertion
INSERT INTO
    shop_product_sizes(product_id, size_id, stock)
VALUES
    (1000001, 'S', 45);

-- Display the results to check SKU generation
SELECT
    product_id,
    size_id,
    stock,
    sku
FROM
    shop_product_sizes
ORDER BY
    product_id,
    size_id;

ALTER TABLE
    shop_designs
ADD
    COLUMN IF NOT EXISTS description TEXT;

SELECT
    *
FROM
    shop_sizes
WHERE
    slug = 'women';

SELECT
    *
FROM
    shop_images;

ALTER TABLE
    shop_products
ALTER COLUMN
    original_price DROP NOT NULL;

-- Check the current images in the database
SELECT
    *
FROM
    shop_images
WHERE
    product_id = 1000005;

DELETE FROM
    shop_images
WHERE
    product_id = 1000005;

-- Show the created_by column from the shop_images table to understand its type
SELECT
    column_name,
    data_type,
    is_nullable
FROM
    information_schema.columns
WHERE
    table_name = 'shop_images'
    AND column_name = 'created_by';

-- Get detailed image information including paths for debugging
SELECT
    id,
    product_id,
    path,
    key,
    name,
    mime_type,
    created_at
FROM
    shop_images
ORDER BY
    created_at DESC
LIMIT
    20;

SELECT
    *
FROM
    shop_pieces;

SELECT
    *
FROM
    shop_product_sizes;

SELECT
    *
FROM
    shop_designs;

INSERT INTO
    shop_product_sizes (product_id, size_id, stock)
VALUES
    (1000000, 'M', 55) ON CONFLICT (product_id, size_id) DO
UPDATE
SET
    stock = EXCLUDED.stock RETURNING *;

SELECT
    *
FROM
    shop_products
INSERT INTO
    shop_types (name)
VALUES
    ('none');

ALTER TABLE
    shop_products DROP CONSTRAINT shop_products_type_fkey,
ADD
    CONSTRAINT shop_products_type_fkey FOREIGN KEY (type) REFERENCES shop_types(id) ON DELETE CASCADE;

ALTER TABLE
    shop_products
ADD
    CONSTRAINT shop_products_collection_fkey FOREIGN KEY (collection) REFERENCES shop_collections(id);

ALTER TABLE
    shop_pieces DROP CONSTRAINT shop_pieces_product_id_fkey,
ADD
    CONSTRAINT shop_pieces_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE;

SELECT
    *
FROM
    shop_pieces
WHERE
    product_id = 1000018;

SELECT
    *
FROM
    shop_images;

SELECT
    b.id,
    b.name,
    b.created_at,
    b.updated_at,
    COUNT(p.id) as product_count,
    (
        SELECT
            i.image_url
        FROM
            shop_images i
        WHERE
            i.brand_id = b.id
        ORDER BY
            i.created_at DESC
        LIMIT
            1
    ) as image_url
FROM
    shop_brands b
    LEFT JOIN shop_products p ON b.id = p.brand
GROUP BY
    b.id,
    b.name,
    b.created_at,
    b.updated_at
ORDER BY
    b.name ASC;

SELECT
    *
FROM
    shop_orders
SELECT
    *
FROM
    users;

SELECT
    *
FROM
    shop_sexes;