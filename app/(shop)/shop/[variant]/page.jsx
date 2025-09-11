import getShopVariants from "@/data/dal/shop/get-shop-variants";
import { notFound } from "next/navigation";

const VariantPage = async ({ params }) => {
  const paramVariant = (await params).variant;
  const availableVariants = (await getShopVariants(paramVariant)) || [];

  if (!availableVariants.ok || availableVariants.length === 0) {
    return notFound();
  }

  return <p>{JSON.stringify(availableVariants.data[0])}</p>;
};

export default VariantPage;
