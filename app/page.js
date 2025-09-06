import Carousel from "@/components/ui/factory/carousel/Carousel";
import { ArrowBigRight, ArrowRight, ArrowRightIcon, ClockIcon } from "lucide-react";
import ProductCard from "@/components/ui/factory/product-cards/ProductCard";
import CARDBG from "@/data/placeholder/category-image-2.jpg";
import getProductsPaginated from "@/data/dal/shop/products/get-all-products-paginated";
import Image from "next/image";
import Link from "next/link";
import getShopBrands from "@/data/dal/shop/get-shop-brands";
import InfiniteSlider from "@/components/ui/infinite-slider";
import { SilkBackground } from "@/components/ui/SilkBackground";

export default async function Home() {
  const products = await getProductsPaginated({
    limit: 4,
    offset: 0,
    filters: { published_status: "published", featured: true },
    sorts: { created_at: "desc", featured_at: "desc" },
  });
  const brands = await getShopBrands();

  return (
    <div>
      <Carousel />

      <div className="mx-auto px-4 py-6 pb-0 max-w-[1920px]">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5 grid-flow-row">
          <Link href="/shop" className="group overflow-hidden border-1 border-primary relative flex items-end" aria-label="Twitter">
            {/* <Image src={CARDBG} alt="Featured Product" className="object-cover w-full h-full absolute top-0 left-0 z-0" /> */}
            <SilkBackground className="absolute inset-0 z-0" color="#ffffff" rotation={136} />
            <div className="flex flex-col relative z-10 bg-gradient-to-b from-transparent to-black p-6 text-primary space-y-2">
              <h3 className="text-2xl tracking-tight font-mono font-bold border-b-2 pb-1 border-white text-white">Featured Products</h3>
              <p className="text-white">From the personal wardrobes of our stylists </p>
              <p className="text-white hover:underline">
                View All Featured Products
                <ArrowRightIcon className="inline -rotate-45" />
              </p>
            </div>
          </Link>
          {products.products.map((product) => {
            return <ProductCard product={product} key={product.id} />;
          })}
        </div>
      </div>

      <div className="py-12">
        <InfiniteSlider gap={32} className="" speedOnHover={50} speed={100}>
          {brands.data.map((brand) => {
            return (
              <Image
                src={brand.image_url}
                alt={`Logo of ${brand.name}`}
                width={100}
                height={100}
                unoptimized={true}
                className="h-[30px] w-auto"
                key={brand.id}
              />
            );
          })}
        </InfiniteSlider>
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
