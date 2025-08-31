import Carousel from "@/components/ui/factory/carousel/Carousel";
import { ClockIcon } from "lucide-react";
import ProductCard from "@/components/ui/factory/product-cards/ProductCard";

import getProductsPaginated from "@/data/dal/shop/products/get-all-products-paginated";

export default async function Home() {
  const products = await getProductsPaginated({ limit: 20, offset: 0, filters: { published_status: "published" } });

  return (
    <div>
      <Carousel />

      <div className="mx-auto px-4 py-8 max-w-[1920px]">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 grid-flow-row">
          {products.products.map((product) => {
            return <ProductCard product={product} key={product.id} />;
          })}
        </div>
      </div>

      <div className="bg-primary/50">
        <div className="px-6 py-8">
          <div className="grid grid-cols-4 gap-12 grid-flow-row">
            {[...Array(4)].map((_, index) => {
              return (
                <div key={index} className="overflow-hidden col-span-1 flex items-center gap-4">
                  <ClockIcon className="h-12 w-12 text-secondary" />
                  <div>
                    <span className="text-lg font-bold tracking-wide">Inquire Order</span>
                    <span className="block">Call 0300-1234567 for inquiry</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
