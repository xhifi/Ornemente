import getShopSizes from "@/data/dal/shop/get-shop-sizes";
import SizeList from "./SizeList";

export const metadata = {
  title: "Manage Sizes | Admin Dashboard",
};

export default async function SizesPage() {
  const { data: sizes } = await getShopSizes();
  return <SizeList initialSizes={sizes} />;
}
