import getShopBrands from "@/data/dal/shop/get-shop-brands";
import BrandList from "./BrandList";

export const metadata = {
  title: "Manage Brands | Admin Dashboard",
};

export default async function BrandsPage() {
  const { data: brands } = await getShopBrands();
  return <BrandList initialBrands={brands} />;
}
