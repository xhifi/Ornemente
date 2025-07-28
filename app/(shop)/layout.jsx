import Breadcrumbs from "@/components/ui/factory/Breadcrumbs";

const ShopLayout = ({ children }) => {
  return (
    <>
      <Breadcrumbs />
      {children}
    </>
  );
};

export default ShopLayout;
