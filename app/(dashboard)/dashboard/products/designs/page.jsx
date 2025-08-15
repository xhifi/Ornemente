import getShopDesigns from "@/data/dal/shop/get-shop-designs";
import DesignList from "./DesignList";

export const metadata = {
  title: "Manage Designs | Admin Dashboard",
};

export default async function DesignsPage() {
  const { data: designs } = await getShopDesigns();
  return <DesignList initialDesigns={designs} />;
}
