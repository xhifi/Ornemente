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
-- Auth Related Tables
-- ========================
-- Users Table for Better Auth
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    email_verified BOOLEAN DEFAULT FALSE,
    password TEXT,
    image TEXT,
    phone TEXT UNIQUE,
    provider_role TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- Sessions Table for Better Auth
CREATE TABLE sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    fresh BOOLEAN DEFAULT FALSE,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Accounts Table for Better Auth
CREATE TABLE accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id TEXT NOT NULL,
    provider_id TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    id_token TEXT,
    scope TEXT,
    access_token_expires_at TIMESTAMP WITH TIME ZONE,
    refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, provider_id)
);

-- Verifications Table for Better Auth
CREATE TABLE verifications (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================
-- Role-Based Access Control (RBAC) System
-- ========================
-- Resources Table - Defines what resources exist in the system
CREATE TABLE resources (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    -- e.g., 'products', 'orders', 'users', 'categories'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- Permissions Table - Defines what actions can be performed
CREATE TABLE permissions (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    -- e.g., 'read', 'create', 'update', 'delete', 'manage'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- Resource Permissions Table - Links permissions to specific resources
CREATE TABLE resource_permissions (
    id SERIAL PRIMARY KEY,
    resource_id INTEGER NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id),
    UNIQUE(resource_id, permission_id) -- Prevent duplicate resource-permission combinations
);

-- Roles Table - Defines user roles
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    -- e.g., 'customer', 'admin', 'manager', 'seller'
    priority INTEGER NOT NULL DEFAULT 100,
    -- Lower numbers = higher priority (1 = highest, 100 = lowest)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- Role Permissions Table - Links roles to resource permissions
CREATE TABLE role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    resource_permission_id INTEGER NOT NULL REFERENCES resource_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id),
    UNIQUE(role_id, resource_permission_id) -- Prevent duplicate role-permission combinations
);

-- User Roles Table - Assigns roles to users (many-to-many relationship)
CREATE TABLE user_roles (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by TEXT REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    -- Optional expiration date for temporary roles
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id),
    UNIQUE(user_id, role_id) -- Prevent duplicate user-role assignments
);

-- ========================
-- RBAC Indexes for Performance
-- ========================
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);

CREATE INDEX idx_resource_permissions_resource ON resource_permissions(resource_id);

CREATE INDEX idx_roles_priority ON roles(priority);

CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);

-- ========================
-- RBAC Triggers for updated_at
-- ========================
CREATE TRIGGER trigger_resources_updated_at BEFORE
UPDATE
    ON resources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_permissions_updated_at BEFORE
UPDATE
    ON permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_resource_permissions_updated_at BEFORE
UPDATE
    ON resource_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_roles_updated_at BEFORE
UPDATE
    ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_role_permissions_updated_at BEFORE
UPDATE
    ON role_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_roles_updated_at BEFORE
UPDATE
    ON user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================
-- RBAC Priority Enforcement Trigger
-- ========================
CREATE
OR REPLACE FUNCTION enforce_role_assignment_hierarchy() RETURNS TRIGGER AS $ $ DECLARE acting_user_priority INTEGER;

role_priority INTEGER;

BEGIN -- Skip validation if no assigned_by user (system assignment)
IF NEW.assigned_by IS NULL THEN RETURN NEW;

END IF;

-- Get the highest priority for the user doing the assignment
acting_user_priority := get_user_highest_priority(NEW.assigned_by);

-- Get the priority of the role being assigned
SELECT
    priority INTO role_priority
FROM
    roles
WHERE
    id = NEW.role_id;

-- Check if the acting user can assign this role
IF acting_user_priority >= COALESCE(role_priority, 999) THEN RAISE EXCEPTION 'Insufficient privileges: Cannot assign role with equal or higher priority than your own roles';

END IF;

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enforce_role_assignment_hierarchy BEFORE
INSERT
    ON user_roles FOR EACH ROW EXECUTE FUNCTION enforce_role_assignment_hierarchy();

-- ========================
-- Auto-assign Customer Role Trigger
-- ========================
CREATE
OR REPLACE FUNCTION auto_assign_customer_role() RETURNS TRIGGER AS $ $ DECLARE customer_role_id INTEGER;

BEGIN -- Get the customer role ID
SELECT
    id INTO customer_role_id
FROM
    roles
WHERE
    name = 'customer';

-- Only proceed if customer role exists
IF customer_role_id IS NOT NULL THEN -- Insert the user_role record, but only if it doesn't already exist
INSERT INTO
    user_roles (
        user_id,
        role_id,
        assigned_by,
        created_by,
        updated_by
    )
VALUES
    (NEW.id, customer_role_id, NULL, NULL, NULL) ON CONFLICT (user_id, role_id) DO NOTHING;

END IF;

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_assign_customer_role
AFTER
INSERT
    ON users FOR EACH ROW EXECUTE FUNCTION auto_assign_customer_role();

-- ========================
-- RBAC Helper Functions
-- ========================
-- Function to check if a user has a specific role
CREATE
OR REPLACE FUNCTION user_has_role(p_user_id TEXT, p_role_name TEXT) RETURNS BOOLEAN AS $ $ DECLARE has_role BOOLEAN := FALSE;

BEGIN
SELECT
    TRUE INTO has_role
FROM
    user_roles ur
    JOIN roles r ON ur.role_id = r.id
WHERE
    ur.user_id = p_user_id
    AND r.name = p_role_name
    AND (
        ur.expires_at IS NULL
        OR ur.expires_at > NOW()
    )
LIMIT
    1;

RETURN COALESCE(has_role, FALSE);

END;

$ $ LANGUAGE plpgsql;

-- Function to check if a user has a specific permission on a resource
CREATE
OR REPLACE FUNCTION user_has_permission(
    p_user_id TEXT,
    p_resource_name TEXT,
    p_permission_name TEXT
) RETURNS BOOLEAN AS $ $ DECLARE has_permission BOOLEAN := FALSE;

BEGIN -- Check role-based permissions
SELECT
    TRUE INTO has_permission
FROM
    user_roles ur
    JOIN roles ro ON ur.role_id = ro.id
    JOIN role_permissions rpr ON ro.id = rpr.role_id
    JOIN resource_permissions rp ON rpr.resource_permission_id = rp.id
    JOIN resources r ON rp.resource_id = r.id
    JOIN permissions p ON rp.permission_id = p.id
WHERE
    ur.user_id = p_user_id
    AND r.name = p_resource_name
    AND p.name = p_permission_name
    AND (
        ur.expires_at IS NULL
        OR ur.expires_at > NOW()
    )
LIMIT
    1;

RETURN COALESCE(has_permission, FALSE);

END;

$ $ LANGUAGE plpgsql;

-- Enhanced function to get all roles for a user, including permissions, resource, and scope
CREATE
OR REPLACE FUNCTION get_user_roles(p_user_id TEXT) RETURNS TABLE (
    role_id INTEGER,
    role_name TEXT,
    role_priority INTEGER,
    assigned_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB
) AS $ $ BEGIN RETURN QUERY
SELECT
    r.id as role_id,
    r.name as role_name,
    r.priority as role_priority,
    ur.assigned_at,
    ur.expires_at,
    (
        SELECT
            jsonb_agg(
                jsonb_build_object(
                    'permission_id',
                    p.id,
                    'permission_name',
                    p.name,
                    'resource_id',
                    res.id,
                    'resource_name',
                    res.name -- Add 'scope', p.scope if you have a scope column in permissions
                )
            )
        FROM
            role_permissions rp
            JOIN resource_permissions rpr ON rp.resource_permission_id = rpr.id
            JOIN permissions p ON rpr.permission_id = p.id
            JOIN resources res ON rpr.resource_id = res.id
        WHERE
            rp.role_id = r.id
    ) as permissions
FROM
    user_roles ur
    JOIN roles r ON ur.role_id = r.id
WHERE
    ur.user_id = p_user_id
    AND (
        ur.expires_at IS NULL
        OR ur.expires_at > NOW()
    )
ORDER BY
    r.priority ASC,
    r.name;

END;

$ $ LANGUAGE plpgsql;

-- Function to get all permissions for a user
CREATE
OR REPLACE FUNCTION get_user_permissions(p_user_id TEXT) RETURNS TABLE (
    resource_name TEXT,
    permission_name TEXT,
    role_name TEXT
) AS $ $ BEGIN RETURN QUERY
SELECT
    DISTINCT r.name as resource_name,
    p.name as permission_name,
    ro.name as role_name
FROM
    user_roles ur
    JOIN roles ro ON ur.role_id = ro.id
    JOIN role_permissions rpr ON ro.id = rpr.role_id
    JOIN resource_permissions rp ON rpr.resource_permission_id = rp.id
    JOIN resources r ON rp.resource_id = r.id
    JOIN permissions p ON rp.permission_id = p.id
WHERE
    ur.user_id = p_user_id
    AND (
        ur.expires_at IS NULL
        OR ur.expires_at > NOW()
    )
ORDER BY
    r.name,
    p.name,
    ro.name;

END;

$ $ LANGUAGE plpgsql;

-- Function to get the highest priority (lowest number) role for a user
CREATE
OR REPLACE FUNCTION get_user_highest_priority(p_user_id TEXT) RETURNS INTEGER AS $ $ DECLARE highest_priority INTEGER := 999;

-- Default to very low priority
BEGIN
SELECT
    MIN(r.priority) INTO highest_priority
FROM
    user_roles ur
    JOIN roles r ON ur.role_id = r.id
WHERE
    ur.user_id = p_user_id
    AND (
        ur.expires_at IS NULL
        OR ur.expires_at > NOW()
    );

RETURN COALESCE(highest_priority, 999);

END;

$ $ LANGUAGE plpgsql;

-- Function to check if user can modify another user based on role priority
CREATE
OR REPLACE FUNCTION user_can_modify_user(
    p_acting_user_id TEXT,
    p_target_user_id TEXT
) RETURNS BOOLEAN AS $ $ DECLARE acting_user_priority INTEGER;

target_user_priority INTEGER;

BEGIN -- Get the highest priority (lowest number) for both users
acting_user_priority := get_user_highest_priority(p_acting_user_id);

target_user_priority := get_user_highest_priority(p_target_user_id);

-- User can modify if their priority is higher (lower number) than target
-- Or if they are modifying themselves
RETURN (acting_user_priority < target_user_priority)
OR (p_acting_user_id = p_target_user_id);

END;

$ $ LANGUAGE plpgsql;

-- Function to check if user can assign a specific role based on priority
CREATE
OR REPLACE FUNCTION user_can_assign_role(
    p_acting_user_id TEXT,
    p_role_name TEXT
) RETURNS BOOLEAN AS $ $ DECLARE acting_user_priority INTEGER;

role_priority INTEGER;

BEGIN -- Get the highest priority for the acting user
acting_user_priority := get_user_highest_priority(p_acting_user_id);

-- Get the priority of the role being assigned
SELECT
    priority INTO role_priority
FROM
    roles
WHERE
    name = p_role_name;

-- User can assign role if their priority is higher (lower number) than the role
RETURN acting_user_priority < COALESCE(role_priority, 999);

END;

$ $ LANGUAGE plpgsql;

-- ========================
-- Initial RBAC Data Setup
-- ========================
-- Insert basic permissions
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

-- Lowest priority
-- Assign permissions to customer role
INSERT INTO
    role_permissions (role_id, resource_permission_id)
SELECT
    r.id,
    rp.id
FROM
    roles r
    JOIN resource_permissions rp ON TRUE
    JOIN resources res ON rp.resource_id = res.id
    JOIN permissions p ON rp.permission_id = p.id
WHERE
    r.name = 'customer'
    AND (
        (
            res.name = 'products'
            AND p.name = 'read'
        )
        OR (
            res.name = 'categories'
            AND p.name = 'read'
        )
        OR (
            res.name = 'orders'
            AND p.name IN ('read', 'create')
        )
        OR (
            res.name = 'reviews'
            AND p.name IN ('read', 'create', 'update')
        )
    );

-- Assign permissions to seller role (includes customer permissions plus inventory management)
INSERT INTO
    role_permissions (role_id, resource_permission_id)
SELECT
    r.id,
    rp.id
FROM
    roles r
    JOIN resource_permissions rp ON TRUE
    JOIN resources res ON rp.resource_id = res.id
    JOIN permissions p ON rp.permission_id = p.id
WHERE
    r.name = 'seller'
    AND (
        (
            res.name = 'products'
            AND p.name IN ('read', 'create', 'update', 'delete')
        )
        OR (
            res.name = 'categories'
            AND p.name = 'read'
        )
        OR (
            res.name = 'orders'
            AND p.name = 'read'
        )
        OR (
            res.name = 'inventory'
            AND p.name IN ('read', 'update')
        )
        OR (
            res.name = 'reviews'
            AND p.name = 'read'
        )
    );

-- Assign permissions to manager role (broader access)
INSERT INTO
    role_permissions (role_id, resource_permission_id)
SELECT
    r.id,
    rp.id
FROM
    roles r
    JOIN resource_permissions rp ON TRUE
    JOIN resources res ON rp.resource_id = res.id
    JOIN permissions p ON rp.permission_id = p.id
WHERE
    r.name = 'manager'
    AND (
        (
            res.name IN (
                'products',
                'categories',
                'orders',
                'reviews',
                'inventory'
            )
            AND p.name IN ('read', 'create', 'update')
        )
        OR (
            res.name = 'users'
            AND p.name = 'read'
        )
        OR (
            res.name = 'reports'
            AND p.name = 'read'
        )
    );

-- Assign permissions to admin role (almost everything except super admin functions)
INSERT INTO
    role_permissions (role_id, resource_permission_id)
SELECT
    r.id,
    rp.id
FROM
    roles r
    JOIN resource_permissions rp ON TRUE
    JOIN resources res ON rp.resource_id = res.id
    JOIN permissions p ON rp.permission_id = p.id
WHERE
    r.name = 'admin'
    AND NOT (
        res.name = 'settings'
        AND p.name IN ('delete', 'manage')
    );

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

-- ========================
-- shop_sexes
-- ========================
CREATE TABLE shop_sexes (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
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
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
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
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
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
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
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
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
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
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
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
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
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
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

ALTER SEQUENCE shop_products_id_seq RESTART WITH 1000000;

-- ========================
-- shop_pieces
-- ========================
CREATE TABLE shop_pieces (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    fabric INTEGER REFERENCES shop_fabrics(id),
    color INTEGER REFERENCES shop_colors(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

ALTER SEQUENCE shop_pieces_id_seq RESTART WITH 41;

-- ========================
-- shop_product_sizes
-- ========================
CREATE TABLE shop_product_sizes (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES shop_products(id) ON DELETE CASCADE,
    size_id VARCHAR(10) REFERENCES shop_sizes(code),
    stock INT NOT NULL DEFAULT 0,
    sku VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
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
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- ========================
-- shop_product_designs
-- ========================
CREATE TABLE shop_product_designs (
    product_id INTEGER REFERENCES shop_products(id) ON DELETE CASCADE,
    design_id INTEGER REFERENCES shop_designs(id),
    PRIMARY KEY (product_id, design_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- ========================
-- shop_images
-- ========================
CREATE TABLE shop_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id INTEGER REFERENCES shop_products(id) ON DELETE CASCADE,
    brand_id INTEGER REFERENCES shop_brands(id) ON DELETE CASCADE,
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
    size_variations JSONB,
    -- Store size variations of the image (thumbnails, etc.)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- Create a unique index for product images to prevent duplicates
CREATE UNIQUE INDEX idx_shop_images_product_path ON shop_images(product_id, path)
WHERE
    product_id IS NOT NULL;

-- Create a unique index for brand images to prevent duplicates
CREATE UNIQUE INDEX idx_shop_images_brand_path ON shop_images(brand_id, path)
WHERE
    brand_id IS NOT NULL;

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
    OR
UPDATE
    OF name ON shop_types FOR EACH ROW EXECUTE FUNCTION set_shop_types_slug();

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
-- shop_orders
-- ========================
CREATE TYPE order_status AS ENUM (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'returned',
    'refunded'
);

CREATE TYPE payment_method AS ENUM (
    'cash_on_delivery',
    'credit_card',
    'bank_transfer',
    'wallet'
);

CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');

-- Order table to track all customer orders
CREATE TABLE shop_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id TEXT REFERENCES users(id),
    -- Can be NULL for anonymous orders
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT NOT NULL,
    billing_address JSONB NOT NULL,
    -- Structured address data
    shipping_address JSONB NOT NULL,
    -- Can be different from billing
    total_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    final_amount DECIMAL(12, 2) NOT NULL,
    -- After discounts, shipping, tax
    notes TEXT,
    -- Customer notes for the order
    order_status order_status DEFAULT 'pending',
    payment_method payment_method,
    payment_status payment_status DEFAULT 'pending',
    tracking_number TEXT,
    -- For shipping tracking
    estimated_delivery_date DATE,
    actual_delivery_date TIMESTAMP,
    ip_address TEXT,
    -- For security/tracking
    user_agent TEXT,
    -- Browser info
    metadata JSONB,
    -- Additional data that doesn't fit elsewhere
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- Table for individual order items
CREATE TABLE shop_order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES shop_orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES shop_products(id),
    product_sku VARCHAR REFERENCES shop_product_sizes(sku),
    product_name TEXT NOT NULL,
    -- Store name at time of purchase
    size_code VARCHAR(10) REFERENCES shop_sizes(code),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    total_price DECIMAL(12, 2) NOT NULL,
    -- unit_price * quantity - discount
    product_data JSONB,
    -- Snapshot of product data at time of purchase
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table for order status history
CREATE TABLE shop_order_status_history (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES shop_orders(id) ON DELETE CASCADE,
    status order_status NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES users(id)
);

-- Table for payment transactions
CREATE TABLE shop_payment_transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES shop_orders(id) ON DELETE CASCADE,
    transaction_id TEXT,
    -- Payment gateway transaction ID
    amount DECIMAL(12, 2) NOT NULL,
    payment_method payment_method,
    payment_status payment_status,
    gateway_response JSONB,
    -- Response from payment gateway
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Function to generate a unique order number
CREATE
OR REPLACE FUNCTION generate_order_number() RETURNS TRIGGER AS $ $ BEGIN -- Format: YYMMDDxxxxx (year, month, day, and 5-digit sequence)
NEW.order_number := TO_CHAR(NOW(), 'YYMMDD') || LPAD(NEXTVAL('shop_orders_id_seq') :: TEXT, 5, '0');

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Trigger to automatically generate order number before insert
CREATE TRIGGER trg_generate_order_number BEFORE
INSERT
    ON shop_orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Function to automatically add the initial status to history
CREATE
OR REPLACE FUNCTION add_initial_order_status() RETURNS TRIGGER AS $ $ BEGIN
INSERT INTO
    shop_order_status_history (order_id, status, comment)
VALUES
    (NEW.id, NEW.order_status, 'Order created');

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Trigger to automatically add the initial status
CREATE TRIGGER trg_add_initial_order_status
AFTER
INSERT
    ON shop_orders FOR EACH ROW EXECUTE FUNCTION add_initial_order_status();

-- Function to update order history when status changes
CREATE
OR REPLACE FUNCTION update_order_status_history() RETURNS TRIGGER AS $ $ BEGIN IF OLD.order_status <> NEW.order_status THEN
INSERT INTO
    shop_order_status_history (order_id, status, comment, created_by)
VALUES
    (
        NEW.id,
        NEW.order_status,
        'Status updated from ' || OLD.order_status || ' to ' || NEW.order_status,
        NEW.updated_by
    );

END IF;

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Trigger to track order status changes
CREATE TRIGGER trg_update_order_status_history
AFTER
UPDATE
    OF order_status ON shop_orders FOR EACH ROW EXECUTE FUNCTION update_order_status_history();

-- Indexes for order tables
CREATE INDEX idx_shop_orders_user_id ON shop_orders(user_id);

CREATE INDEX idx_shop_orders_order_status ON shop_orders(order_status);

CREATE INDEX idx_shop_orders_payment_status ON shop_orders(payment_status);

CREATE INDEX idx_shop_orders_created_at ON shop_orders(created_at);

CREATE INDEX idx_shop_order_items_order_id ON shop_order_items(order_id);

CREATE INDEX idx_shop_order_items_product_id ON shop_order_items(product_id);

CREATE INDEX idx_shop_order_items_product_sku ON shop_order_items(product_sku);

CREATE INDEX idx_shop_order_status_history_order_id ON shop_order_status_history(order_id);

CREATE INDEX idx_shop_payment_transactions_order_id ON shop_payment_transactions(order_id);

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
-- Auth Related Indexes
-- ========================
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_users_phone ON users(phone);

CREATE INDEX idx_users_email_verified ON users(email_verified);

CREATE INDEX idx_sessions_token ON sessions(token);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);

CREATE INDEX idx_accounts_user_id ON accounts(user_id);

CREATE INDEX idx_accounts_provider_account ON accounts(provider_id, account_id);

CREATE INDEX idx_verifications_value ON verifications(value);

CREATE INDEX idx_verifications_identifier ON verifications(identifier);

CREATE INDEX idx_verifications_expires_at ON verifications(expires_at);

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
-- ========================
-- Featured Products
-- ========================
-- Create shop_products_featured table
CREATE TABLE shop_products_featured (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES shop_products(id) ON DELETE CASCADE,
    featured_at TIMESTAMP DEFAULT NOW(),
    feature_until TIMESTAMP,
    feature_reason TEXT,
    feature_type TEXT DEFAULT 'homepage',
    feature_priority INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by TEXT REFERENCES users(id),
    updated_by TEXT REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_shop_products_featured_product_id ON shop_products_featured(product_id);

CREATE INDEX idx_shop_products_featured_featured_at ON shop_products_featured(featured_at);

CREATE INDEX idx_shop_products_featured_feature_until ON shop_products_featured(feature_until);

CREATE INDEX idx_shop_products_featured_feature_type ON shop_products_featured(feature_type);

CREATE INDEX idx_shop_products_featured_feature_priority ON shop_products_featured(feature_priority);

-- Add trigger for updated_at column
CREATE TRIGGER trg_shop_products_featured_updated_at BEFORE
UPDATE
    ON shop_products_featured FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add a featured flag to shop_products table for easier querying
ALTER TABLE
    shop_products
ADD
    COLUMN featured BOOLEAN DEFAULT FALSE;

-- Create a function to update the featured flag in shop_products
CREATE
OR REPLACE FUNCTION update_product_featured_flag() RETURNS TRIGGER AS $ $ BEGIN -- On insert or update, set the featured flag to true for the product
IF (
    TG_OP = 'INSERT'
    OR TG_OP = 'UPDATE'
) THEN
UPDATE
    shop_products
SET
    featured = TRUE,
    updated_at = NOW()
WHERE
    id = NEW.product_id;

END IF;

-- On delete, check if there are any other features for this product
-- If not, set featured flag to false
IF (TG_OP = 'DELETE') THEN
UPDATE
    shop_products
SET
    featured = EXISTS (
        SELECT
            1
        FROM
            shop_products_featured
        WHERE
            product_id = OLD.product_id
            AND (
                feature_until IS NULL
                OR feature_until > NOW()
            )
    ),
    updated_at = NOW()
WHERE
    id = OLD.product_id;

END IF;

RETURN NULL;

END;

$ $ LANGUAGE plpgsql;

-- Create triggers to maintain the featured flag
CREATE TRIGGER trg_maintain_product_featured_flag_insert
AFTER
INSERT
    ON shop_products_featured FOR EACH ROW EXECUTE FUNCTION update_product_featured_flag();

CREATE TRIGGER trg_maintain_product_featured_flag_update
AFTER
UPDATE
    ON shop_products_featured FOR EACH ROW EXECUTE FUNCTION update_product_featured_flag();

CREATE TRIGGER trg_maintain_product_featured_flag_delete
AFTER
    DELETE ON shop_products_featured FOR EACH ROW EXECUTE FUNCTION update_product_featured_flag();

-- Create a scheduled task to update featured flags when feature_until dates expire
CREATE
OR REPLACE FUNCTION cleanup_expired_featured_products() RETURNS void AS $ $ BEGIN -- First, get all products that have expired featured records
WITH expired_products AS (
    SELECT
        DISTINCT product_id
    FROM
        shop_products_featured
    WHERE
        feature_until < NOW()
),
-- Then, for each of those products, check if they have any active featured records
products_to_update AS (
    SELECT
        ep.product_id,
        EXISTS (
            SELECT
                1
            FROM
                shop_products_featured
            WHERE
                product_id = ep.product_id
                AND (
                    feature_until IS NULL
                    OR feature_until > NOW()
                )
        ) AS should_be_featured
    FROM
        expired_products ep
) -- Finally, update the featured flag for products that should change
UPDATE
    shop_products sp
SET
    featured = ptu.should_be_featured,
    updated_at = NOW()
FROM
    products_to_update ptu
WHERE
    sp.id = ptu.product_id
    AND sp.featured != ptu.should_be_featured;

-- You might want to also delete or archive very old featured entries
-- Uncomment if needed:
-- DELETE FROM shop_products_featured
-- WHERE feature_until < NOW() - INTERVAL '30 days';
END;

$ $ LANGUAGE plpgsql;

-- To run this function periodically, you'll need to set up a cron job or similar
-- This is a sample SQL comment showing how you might execute this in a cron job:
-- SELECT cleanup_expired_featured_products();
-- Add featured_at to shop_products to easily sort by when they were featured
ALTER TABLE
    shop_products
ADD
    COLUMN featured_at TIMESTAMP;

-- Create a function to update featured_at when a product is featured
CREATE
OR REPLACE FUNCTION update_product_featured_at() RETURNS TRIGGER AS $ $ BEGIN -- Update the featured_at timestamp in shop_products when a product is featured
-- Only update if the current featured_at is NULL or older than the new featured_at
UPDATE
    shop_products
SET
    featured_at = NEW.featured_at,
    updated_at = NOW()
WHERE
    id = NEW.product_id
    AND (
        featured_at IS NULL
        OR featured_at < NEW.featured_at
    );

RETURN NEW;

END;

$ $ LANGUAGE plpgsql;

-- Create a trigger to update featured_at
CREATE TRIGGER trg_update_product_featured_at BEFORE
INSERT
    OR
UPDATE
    OF featured_at ON shop_products_featured FOR EACH ROW EXECUTE FUNCTION update_product_featured_at();