-- ========================
-- INITIAL DATA INSERTS
-- ========================
-- Insert basic permissions for RBAC
INSERT INTO
    permissions (name)
VALUES
    ('read'),
    ('create'),
    ('update'),
    ('delete'),
    ('manage');

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
    ('settings');

-- Create resource-permission combinations
INSERT INTO
    resource_permissions (resource_id, permission_id)
SELECT
    r.id,
    p.id
FROM
    resources r
    CROSS JOIN permissions p;

-- Insert basic roles
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
    ('customer', 100);

-- Assign all permissions to super_admin role
INSERT INTO
    role_permissions (role_id, resource_permission_id)
SELECT
    r.id,
    rp.id
FROM
    roles r
    JOIN resource_permissions rp ON TRUE
WHERE
    r.name = 'super_admin';

-- Insert shop data
INSERT INTO
    shop_variants(name)
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