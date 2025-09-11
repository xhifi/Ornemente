import ProductCard from "@/components/ui/factory/product-cards/ProductCard";
import getProductsPaginated from "@/data/dal/shop/products/get-all-products-paginated";
import getShopTypes from "@/data/dal/shop/get-shop-types";
import getShopBrands from "@/data/dal/shop/get-shop-brands";
import getShopVariants from "@/data/dal/shop/get-shop-variants";
import getShopPriceRange from "@/data/dal/shop/get-shop-price-range";
import Link from "next/link";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import ProductListFilter from "@/components/ui/factory/product-cards/ProductListFilter";
import ProductSortDropdown from "@/components/ui/factory/product-cards/ProductSortDropdown";

const ShopPage = async ({ params, searchParams }) => {
  const param = await params;
  const search = await searchParams;
  const type = search.type?.split(" ").map((item) => parseInt(item)) || null;
  const brand = search?.brand?.split(" ").map((item) => parseInt(item)) || null;
  const discounted = search?.discounted === "" || typeof search?.discounted === "string" ? true : false || null;
  const variant = param?.variant || null;
  const currentPage = parseInt(search?.page) || 1;
  const sortBy = search?.sort || "latest";
  const minPrice = search?.min_price ? parseFloat(search.min_price) : null;
  const maxPrice = search?.max_price ? parseFloat(search.max_price) : null;

  const products = await getProductsPaginated({
    page: currentPage,
    limit: 4,
    sortBy: sortBy,
    filters: {
      publish_status: "published",
      type: type,
      brand: brand,
      variant: variant,
      discounted: discounted,
      min_price: minPrice,
      max_price: maxPrice,
    },
  });

  // Fetch filter data
  const [typesResponse, brandsResponse, variantsResponse, priceRangeResponse] = await Promise.all([
    getShopTypes(),
    getShopBrands(),
    getShopVariants(),
    getShopPriceRange(),
  ]);

  const filterData = {
    types: typesResponse?.ok ? typesResponse.data : [],
    brands: brandsResponse?.ok ? brandsResponse.data : [],
    variants: variantsResponse?.ok ? variantsResponse.data : [],
  };

  const priceRange = priceRangeResponse?.ok ? priceRangeResponse.data : { min_price: 0, max_price: 10000 };

  // Helper function to create pagination URL with current search params
  const createPaginationUrl = (page) => {
    const params = new URLSearchParams();

    // Preserve existing search parameters
    if (search.type) params.set("type", search.type);
    if (search.brand) params.set("brand", search.brand);
    if (search.discounted !== undefined) params.set("discounted", search.discounted);
    if (search.sort && search.sort !== "latest") params.set("sort", search.sort);
    if (search.min_price) params.set("min_price", search.min_price);
    if (search.max_price) params.set("max_price", search.max_price);

    // Set the page parameter
    if (page > 1) params.set("page", page.toString());

    const queryString = params.toString();
    const basePath = variant ? `/shop/${variant}` : "/shop";
    return queryString ? `${basePath}?${queryString}` : basePath;
  };

  const { pagination } = products;
  const { page, totalPages } = pagination;

  return (
    <section>
      <div className="flex items-center justify-between p-4 bg-background border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold">Products</h1>
          {products?.pagination && <span className="text-sm text-muted-foreground">{products.pagination.total} items</span>}
        </div>

        <div className="flex items-center gap-2">
          <ProductSortDropdown />
          <ProductListFilter data={products} filterData={filterData} priceRange={priceRange} />
        </div>
      </div>

      <div className="mx-auto px-4 py-8 max-w-[1920px]">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 grid-flow-row">
          {products.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-8 select-none">
          <Pagination>
            <PaginationContent>
              {/* Previous Page */}
              <PaginationItem>
                <PaginationPrevious
                  href={page > 1 ? createPaginationUrl(page - 1) : "#"}
                  className={page <= 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {/* First Page */}
              {page > 2 && (
                <PaginationItem>
                  <PaginationLink href={createPaginationUrl(1)}>1</PaginationLink>
                </PaginationItem>
              )}

              {/* Ellipsis before current page */}
              {page > 3 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Previous page number */}
              {page > 1 && (
                <PaginationItem>
                  <PaginationLink href={createPaginationUrl(page - 1)}>{page - 1}</PaginationLink>
                </PaginationItem>
              )}

              {/* Current Page */}
              <PaginationItem>
                <PaginationLink href={createPaginationUrl(page)} isActive>
                  {page}
                </PaginationLink>
              </PaginationItem>

              {/* Next page number */}
              {page < totalPages && (
                <PaginationItem>
                  <PaginationLink href={createPaginationUrl(page + 1)}>{page + 1}</PaginationLink>
                </PaginationItem>
              )}

              {/* Ellipsis after current page */}
              {page < totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}

              {/* Last Page */}
              {page < totalPages - 1 && (
                <PaginationItem>
                  <PaginationLink href={createPaginationUrl(totalPages)}>{totalPages}</PaginationLink>
                </PaginationItem>
              )}

              {/* Next Page */}
              <PaginationItem>
                <PaginationNext
                  href={page < totalPages ? createPaginationUrl(page + 1) : "#"}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </section>
  );
};

export default ShopPage;
