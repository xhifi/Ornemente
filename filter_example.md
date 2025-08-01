# Product Filtering Examples

This document provides comprehensive examples of how to use the filtering capabilities of the `getProducts` function in `data/dal/shop/products/product-actions.js`.

## Function Signature

```javascript
getProducts(({ page = 1, limit = 10, search = "", filters = {} } = {}));
```

## Available Filters

Based on the database schema and implementation, the following filters are available:

| Filter           | Description                 | Values                                                      |
| ---------------- | --------------------------- | ----------------------------------------------------------- |
| `sex`            | Filter by gender/sex        | Integer ID from `shop_sexes` table                          |
| `type`           | Filter by product type      | Integer ID or Array of Integer IDs from `shop_types` table  |
| `brand`          | Filter by brand             | Integer ID or Array of Integer IDs from `shop_brands` table |
| `publish_status` | Filter by publishing status | String: `'draft'` or `'published'`                          |

## Basic Usage Examples

### Example 1: Get All Published Products

```javascript
const result = await getProducts({
  filters: {
    publish_status: "published",
  },
});
```

### Example 2: Get Women's Products (First Page, 10 Items)

Assuming women's sex ID is 1:

```javascript
const result = await getProducts({
  filters: {
    sex: 1,
  },
});
```

### Example 3: Get Products from a Specific Brand with Pagination

```javascript
// Get 20 products from Brand ID 5, page 2
const result = await getProducts({
  page: 2,
  limit: 20,
  filters: {
    brand: 5,
  },
});
```

## Combined Filter Examples

### Example 4: Women's Dresses from a Specific Brand

```javascript
// Women's (sex_id=1) dresses (type_id=3) from brand ID 10
const result = await getProducts({
  filters: {
    sex: 1,
    type: 3,
    brand: 10,
  },
});
```

### Example 5: Draft Products of a Specific Type

```javascript
// Draft products of type ID 5
const result = await getProducts({
  filters: {
    type: 5,
    publish_status: "draft",
  },
});
```

### Example 6: Products from Multiple Types

```javascript
// Products that are either shirts (type_id=1) or pants (type_id=2)
const result = await getProducts({
  filters: {
    type: [1, 2], // Multiple types
  },
});
```

### Example 7: Products from Multiple Brands

```javascript
// Products from a selection of luxury brands
const result = await getProducts({
  filters: {
    brand: [101, 105, 110], // Multiple brands
  },
});
```

## Searching with Filters

### Example 8: Search for "silk" in Published Women's Products

```javascript
const result = await getProducts({
  search: "silk",
  filters: {
    sex: 1,
    publish_status: "published",
  },
});
```

This will search for "silk" in the name or description of all published women's products.

## Advanced Examples

### Example 9: Complex Query with Multiple Type and Brand Filters

```javascript
// Get formal clothing (multiple types) from luxury brands (multiple brands)
const result = await getProducts({
  page: 1,
  limit: 50,
  filters: {
    sex: 1, // Women
    type: [3, 4, 7], // Dresses, Formal Suits, and Evening Wear
    brand: [101, 103, 105], // Multiple luxury brands
    publish_status: "published",
  },
});
```

## Full Example with Error Handling

```javascript
async function getPublishedWomenDresses() {
  try {
    const result = await getProducts({
      page: 1,
      limit: 30,
      filters: {
        sex: 1, // Women
        type: 3, // Dresses
        publish_status: "published",
      },
    });

    if (result.success) {
      return result.products;
    } else {
      console.error("Error fetching products:", result.error);
      return [];
    }
  } catch (error) {
    console.error("Exception while fetching products:", error);
    return [];
  }
}
```

## Database Reference

Based on `data/schema.sql`, here are some key tables and their relationships relevant to filtering:

### `shop_products` Table

Contains the main product data with foreign keys to:

- `sex` → References `shop_sexes(id)`
- `type` → References `shop_types(id)`
- `brand` → References `shop_brands(id)`
- `collection` → References `shop_collections(id)`
- Has a `publish_status` field with values 'draft' or 'published'

### Typical IDs from Schema

The schema shows some starting values for sequences:

- `shop_sexes_id_seq RESTART WITH 11` - Sex/gender IDs start at 11
- `shop_types_id_seq RESTART WITH 21` - Product types start at 21
- `shop_brands_id_seq RESTART WITH 101` - Brands start at 101
- `shop_collections_id_seq RESTART WITH 11` - Collections start at 11

## Notes on Performance

- The `getProducts` function uses parameterized queries to prevent SQL injection
- Filters are applied efficiently in the SQL query itself
- A single additional query fetches images for all products at once
- The pagination system allows for efficient loading of large datasets

## Implementation Details

The function:

1. Constructs a SQL query with the appropriate filters
2. Executes the query with pagination
3. Fetches images for all returned products in a batch
4. Calculates pagination metadata (total items, pages)
5. Returns both the product data and pagination information

---

_This document serves as a reference for using the filtering capabilities of the `getProducts` function. For more information, refer to the function implementation in `data/dal/shop/products/product-actions.js`._
