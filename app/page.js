import Carousel from "@/components/ui/factory/carousel/Carousel";
import { ClockIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ui/factory/product-cards/ProductCard";

import getProductsPaginated from "@/data/dal/shop/products/get-all-products-paginated";

export default async function Home() {
  const products = await getProductsPaginated({ limit: 10, offset: 0 });

  return (
    <div className="dark">
      <Carousel />

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-5 gap-12 grid-flow-row">
          {[...Array(5)].map((_, index) => {
            return (
              <Link href="/" key={index} className="col-span-1 flex justify-center flex-col group">
                <Image
                  src={`https://avatar.iran.liara.run/public/girl?username=${index}`}
                  width={500}
                  height={500}
                  unoptimized={true}
                  alt=""
                  className="rounded-full object-cover max-w-full object-center block mx-auto border-2 border-primary border-spacing-4 p-1 group-hover:scale-105 transition-transform duration-300 ease-in-out"
                />
                <span className="text-center text-2xl">Category {index + 1}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto px-4 py-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 grid-flow-row">
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
