import getShopSexes from "@/data/dal/shop/get-shop-sexes";

const SexPage = async ({ params }) => {
  const paramSex = (await params).sex;
  const availableSexes = await getShopSexes(paramSex);

  if (!availableSexes.ok) {
    return <div>{availableSexes.error}</div>;
  }

  return <p>{JSON.stringify(availableSexes.data[0])}</p>;
};

export default SexPage;
