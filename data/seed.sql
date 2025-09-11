-- ========================
-- INITIAL DATA INSERTS
-- ========================
-- Insert basic permissions for RBAC (these will be unique and reusable across resources)
INSERT INTO
    permissions (name)
VALUES
    ('read'),
    ('create'),
    ('update'),
    ('delete'),
    ('manage') ON CONFLICT (name) DO NOTHING;

-- Insert basic resources for an e-commerce system
INSERT INTO
    resources (name)
VALUES
    ('products'),
    ('categories'),
    ('orders'),
    ('users'),
    ('reviews'),
    ('inventory'),
    ('reports'),
    ('colors'),
    ('designs'),
    ('sizes'),
    ('types'),
    ('brands'),
    ('resources'),
    ('permissions'),
    ('roles'),
    ('returns') ON CONFLICT (name) DO NOTHING;

-- Create resource-permission combinations (assign each permission to all resources)
INSERT INTO
    resource_permissions (resource_id, permission_id)
SELECT
    r.id,
    p.id
FROM
    resources r
    CROSS JOIN permissions p ON CONFLICT (resource_id, permission_id) DO NOTHING;

-- Insert basic roles with corrected priorities (lower number = higher priority)
INSERT INTO
    roles (name, priority)
VALUES
    ('super_admin', 1),
    -- Highest priority
    ('admin', 10),
    -- High priority
    ('manager', 20),
    -- Medium-high priority
    ('seller', 30),
    -- Medium priority
    ('customer', 100) -- Lowest priority
    ON CONFLICT (name) DO NOTHING;

-- Assign all resource_permissions to super_admin role
INSERT INTO
    role_permissions (role_id, resource_permission_id)
SELECT
    r.id,
    rp.id
FROM
    roles r
    CROSS JOIN resource_permissions rp
WHERE
    r.name = 'super_admin' ON CONFLICT (role_id, resource_permission_id) DO NOTHING;

-- Insert shop data
INSERT INTO
    shop_variants(name)
VALUES
    ('men'),
    ('women'),
    ('unisex'),
    ('kids') ON CONFLICT (name) DO NOTHING;

-- Reset sequence to avoid conflicts
SELECT
    setval(
        'shop_variants_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                shop_variants
        ),
        false
    );

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
    ('XL/XXL') ON CONFLICT (code) DO NOTHING;

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
    ('Almirah') ON CONFLICT (name) DO NOTHING;

-- Reset sequence to avoid conflicts  
SELECT
    setval(
        'shop_brands_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                shop_brands
        ),
        false
    );

INSERT INTO
    shop_types(name)
VALUES
    ('none'),
    ('Stitched'),
    ('Un-stitched'),
    ('Dress'),
    ('Ready to wear'),
    ('Pret') ON CONFLICT (name) DO NOTHING;

-- Reset sequence to avoid conflicts
SELECT
    setval(
        'shop_types_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                shop_types
        ),
        false
    );

INSERT INTO
    shop_designs(name)
VALUES
    ('none'),
    ('embroidered'),
    ('printed'),
    ('digital-printed'),
    ('plain'),
    ('dyed') ON CONFLICT (name) DO NOTHING;

-- Reset sequence to avoid conflicts
SELECT
    setval(
        'shop_designs_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                shop_designs
        ),
        false
    );

INSERT INTO
    shop_collections(name)
VALUES
    ('Summer Collection'),
    ('Winter Collection'),
    ('Eid Collection'),
    ('Bridal Collection'),
    ('Festive Collection') ON CONFLICT (name) DO NOTHING;

-- Reset sequence to avoid conflicts
SELECT
    setval(
        'shop_collections_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                shop_collections
        ),
        false
    );

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
    ('Wool') ON CONFLICT (name) DO NOTHING;

-- Reset sequence to avoid conflicts
SELECT
    setval(
        'shop_fabrics_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                shop_fabrics
        ),
        false
    );