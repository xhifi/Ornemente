-- ========================
-- INITIAL DATA INSERTS
-- ========================
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
    ('returns'),
    ('shop_variants') ON CONFLICT (name) DO NOTHING;

-- Insert resource-specific permissions (format: resource.action)
-- This provides granular control over what actions can be performed on each resource
INSERT INTO
    permissions (name)
VALUES
    -- Products permissions
    ('products.read'),
    ('products.create'),
    ('products.update'),
    ('products.delete'),
    ('products.manage'),
    ('products.publish'),
    -- Categories permissions
    ('categories.read'),
    ('categories.create'),
    ('categories.update'),
    ('categories.delete'),
    ('categories.manage'),
    -- Orders permissions
    ('orders.read'),
    ('orders.create'),
    ('orders.update'),
    ('orders.delete'),
    ('orders.manage'),
    ('orders.publish'),
    -- Users permissions
    ('users.read'),
    ('users.create'),
    ('users.update'),
    ('users.delete'),
    ('users.manage'),
    ('users.publish'),
    -- Reviews permissions
    ('reviews.read'),
    ('reviews.create'),
    ('reviews.update'),
    ('reviews.delete'),
    ('reviews.manage'),
    ('reviews.publish'),
    -- Inventory permissions
    ('inventory.read'),
    ('inventory.create'),
    ('inventory.update'),
    ('inventory.delete'),
    ('inventory.manage'),
    -- Reports permissions
    ('reports.read'),
    ('reports.create'),
    ('reports.update'),
    ('reports.delete'),
    ('reports.manage'),
    -- Colors permissions
    ('colors.read'),
    ('colors.create'),
    ('colors.update'),
    ('colors.delete'),
    ('colors.manage'),
    ('colors.publish'),
    -- Designs permissions
    ('designs.read'),
    ('designs.create'),
    ('designs.update'),
    ('designs.delete'),
    ('designs.manage'),
    ('designs.publish'),
    -- Sizes permissions
    ('sizes.read'),
    ('sizes.create'),
    ('sizes.update'),
    ('sizes.delete'),
    ('sizes.manage'),
    ('sizes.publish'),
    -- Types permissions
    ('types.read'),
    ('types.create'),
    ('types.update'),
    ('types.delete'),
    ('types.manage'),
    ('types.publish'),
    -- Brands permissions
    ('brands.read'),
    ('brands.create'),
    ('brands.update'),
    ('brands.delete'),
    ('brands.manage'),
    ('brands.publish'),
    -- Resources permissions (meta-permissions for managing resources)
    ('resources.read'),
    ('resources.create'),
    ('resources.update'),
    ('resources.delete'),
    ('resources.manage'),
    ('resources.publish'),
    -- Permissions permissions (meta-permissions for managing permissions)
    ('permissions.read'),
    ('permissions.create'),
    ('permissions.update'),
    ('permissions.delete'),
    ('permissions.manage'),
    ('permissions.publish'),
    -- Roles permissions (meta-permissions for managing roles)
    ('roles.read'),
    ('roles.create'),
    ('roles.update'),
    ('roles.delete'),
    ('roles.manage'),
    ('roles.publish'),
    -- Returns permissions
    ('returns.read'),
    ('returns.create'),
    ('returns.update'),
    ('returns.delete'),
    ('returns.manage'),
    ('returns.publish'),
    -- Shop Variants permissions
    ('shop_variants.read'),
    ('shop_variants.create'),
    ('shop_variants.update'),
    ('shop_variants.delete'),
    ('shop_variants.manage') ON CONFLICT (name) DO NOTHING;

-- Create resource-permission mappings (each resource-specific permission maps to exactly one resource)
INSERT INTO
    resource_permissions (resource_id, permission_id)
SELECT
    r.id as resource_id,
    p.id as permission_id
FROM
    resources r
    JOIN permissions p ON p.name LIKE CONCAT(r.name, '.%') ON CONFLICT (resource_id, permission_id) DO NOTHING;

-- Reset sequences to avoid conflicts with seeded data
SELECT
    setval(
        'resources_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                resources
        ),
        false
    );

SELECT
    setval(
        'permissions_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                permissions
        ),
        false
    );

SELECT
    setval(
        'roles_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                roles
        ),
        false
    );

SELECT
    setval(
        'resource_permissions_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                resource_permissions
        ),
        false
    );

SELECT
    setval(
        'role_permissions_id_seq',
        (
            SELECT
                COALESCE(MAX(id), 0) + 1
            FROM
                role_permissions
        ),
        false
    );

-- Insert basic roles with corrected priorities (lower number = higher priority)
INSERT INTO
    roles (name, priority)
VALUES
    ('super_admin', 1),
    -- Highest priority - has all permissions
    ('admin', 10),
    -- High priority - administrative access
    ('manager', 20),
    -- Medium-high priority - management functions
    ('product_manager', 25),
    -- Product-specific management
    ('seller', 30),
    -- Medium priority - selling functions
    ('customer', 100) -- Lowest priority - customer functions
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

-- Assign product-related permissions to product_manager role
INSERT INTO
    role_permissions (role_id, resource_permission_id)
SELECT
    r.id,
    rp.id
FROM
    roles r
    CROSS JOIN resource_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
WHERE
    r.name = 'product_manager'
    AND (
        p.name LIKE 'products.%'
        OR p.name LIKE 'categories.%'
        OR p.name LIKE 'colors.%'
        OR p.name LIKE 'designs.%'
        OR p.name LIKE 'sizes.%'
        OR p.name LIKE 'types.%'
        OR p.name LIKE 'brands.%'
        OR p.name LIKE 'shop_variants.%'
        OR p.name IN ('inventory.read', 'inventory.update')
    ) ON CONFLICT (role_id, resource_permission_id) DO NOTHING;

-- Assign limited permissions to customer role (read-only for public content)
INSERT INTO
    role_permissions (role_id, resource_permission_id)
SELECT
    r.id,
    rp.id
FROM
    roles r
    CROSS JOIN resource_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
WHERE
    r.name = 'customer'
    AND (
        p.name IN (
            'products.read',
            'categories.read',
            'colors.read',
            'designs.read',
            'sizes.read',
            'types.read',
            'brands.read',
            'shop_variants.read'
        )
        OR p.name LIKE 'orders.%'
        OR p.name LIKE 'reviews.%'
    ) ON CONFLICT (role_id, resource_permission_id) DO NOTHING;

-- Insert shop data with explicit slugs to avoid conflicts
-- This prevents slug generation triggers from creating duplicate slugs
INSERT INTO
    shop_variants(name, slug)
VALUES
    ('men', 'men'),
    ('women', 'women'),
    ('unisex', 'unisex'),
    ('kids', 'kids') ON CONFLICT (name) DO NOTHING;

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
    shop_sizes(code, slug)
VALUES
    ('XS', 'xs'),
    ('S', 's'),
    ('M', 'm'),
    ('L', 'l'),
    ('XL', 'xl'),
    ('XXL', 'xxl'),
    ('XS/S', 'xs-s'),
    ('M/L', 'm-l'),
    ('XL/XXL', 'xl-xxl') ON CONFLICT (code) DO NOTHING;

INSERT INTO
    shop_brands(name, slug)
VALUES
    ('Nishat', 'nishat'),
    ('JDot', 'jdot'),
    ('Alkaram', 'alkaram'),
    ('Gul Ahmed', 'gul-ahmed'),
    ('Khaadi', 'khaadi'),
    ('Sapphire', 'sapphire'),
    ('Edenrobe', 'edenrobe'),
    ('Outfitters', 'outfitters'),
    ('Almirah', 'almirah') ON CONFLICT (name) DO NOTHING;

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
    shop_types(name, slug)
VALUES
    ('none', 'none'),
    ('Stitched', 'stitched'),
    ('Un-stitched', 'un-stitched'),
    ('Dress', 'dress'),
    ('Ready to wear', 'ready-to-wear'),
    ('Pret', 'pret') ON CONFLICT (name) DO NOTHING;

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

-- Only insert designs if they don't exist (safe for existing databases)
INSERT INTO
    shop_designs(name, slug)
SELECT
    name,
    slug
FROM
    (
        VALUES
            ('none', 'none'),
            ('embroidered', 'embroidered'),
            ('printed', 'printed'),
            ('digital-printed', 'digital-printed'),
            ('plain', 'plain'),
            ('dyed', 'dyed')
    ) AS v(name, slug)
WHERE
    NOT EXISTS (
        SELECT
            1
        FROM
            shop_designs
        WHERE
            shop_designs.name = v.name
            OR shop_designs.slug = v.slug
    );

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
    shop_collections(name, slug)
VALUES
    ('Summer Collection', 'summer-collection'),
    ('Winter Collection', 'winter-collection'),
    ('Eid Collection', 'eid-collection'),
    ('Bridal Collection', 'bridal-collection'),
    ('Festive Collection', 'festive-collection') ON CONFLICT (name) DO NOTHING;

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
    shop_fabrics(name, slug)
VALUES
    ('Cotton', 'cotton'),
    ('Lawn', 'lawn'),
    ('Silk', 'silk'),
    ('Chiffon', 'chiffon'),
    ('Georgette', 'georgette'),
    ('Linen', 'linen'),
    ('Velvet', 'velvet'),
    ('Wool', 'wool') ON CONFLICT (name) DO NOTHING;

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

-- ========================
-- RBAC System Verification
-- ========================
-- Display confirmation that the RBAC system has been properly initialized
-- Resource-specific permissions summary
SELECT
    'RBAC System Initialized Successfully' AS status,
    COUNT(*) AS total_permissions,
    COUNT(DISTINCT SPLIT_PART(name, '.', 1)) AS total_resources
FROM
    permissions
WHERE
    name LIKE '%.%';

-- Role assignments summary
SELECT
    r.name AS role_name,
    COUNT(rp.id) AS assigned_permissions,
    r.priority AS role_priority
FROM
    roles r
    LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY
    r.id,
    r.name,
    r.priority
ORDER BY
    r.priority;

-- NOTE: The first user to register will automatically be assigned the super_admin role
-- This is handled by the trigger function: assign_super_admin_to_first_user()