import getShopSexes from "@/data/dal/shop/get-shop-sexes";
import { notFound } from "next/navigation";

const SexPage = async ({ params }) => {
  const paramSex = (await params).sex;
  const availableSexes = (await getShopSexes(paramSex)) || [];

  if (!availableSexes.ok || availableSexes.length === 0) {
    return notFound();
  }

  return <p>{JSON.stringify(availableSexes.data[0])}</p>;
};

export default SexPage;
