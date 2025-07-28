import AddProduct from "@/components/forms/AddProduct";

import getShopSexes from "@/data/dal/shop/get-shop-sexes";
import getShopTypes from "@/data/dal/shop/get-shop-types";
import getShopBrands from "@/data/dal/shop/get-shop-brands";
import getShopSizes from "@/data/dal/shop/get-shop-sizes";
import getShopDesigns from "@/data/dal/shop/get-shop-designs";
import getShopFabrics from "@/data/dal/shop/get-shop-fabrics";
import getShopColors from "@/data/dal/shop/get-shop-colors";

const DashboardPage = async () => {
  const [availableGenders, availableTypes, availableBrands, availableSizes, availableDesigns, availableFabrics, availableColors] =
    await Promise.all([
      await getShopSexes(),
      await getShopTypes(),
      await getShopBrands(),
      await getShopSizes(),
      await getShopDesigns(),
      await getShopFabrics(),
      await getShopColors(),
    ]);

  const action = async (currentState, formData) => {
    "use server";
    console.log(`FORM DATA`, formData);
    const images = formData?.getAll("images");

    const imageFiles = await Promise.all(
      images.map(async (image) => {
        return {
          buffer: await image.arrayBuffer(),
          name: image.name,
          type: image.type,
          base64: await image.arrayBuffer().then((buf) => Buffer.from(buf).toString("base64")),
        };
      })
    );

    return {
      ...currentState,
      name: formData.get("name"),
      description: formData.get("description"),
      tagline: formData.get("tagline"),
      sex: formData.get("sex"),
      type: formData.get("type"),
      brand: formData.get("brand"),
      original_price: formData.get("original_price"),
      discount: formData.get("discount"),
      note: formData.get("note"),
      images: imageFiles,
    };
  };

  return (
    <AddProduct
      sexes={availableGenders}
      types={availableTypes}
      brands={availableBrands}
      sizes={availableSizes}
      designs={availableDesigns}
      fabrics={availableFabrics}
      colors={availableColors}
      action={action}
    />
  );
};

export default DashboardPage;
