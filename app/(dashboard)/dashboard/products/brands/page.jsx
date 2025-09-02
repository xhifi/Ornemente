import getShopBrands from "@/data/dal/shop/get-shop-brands";
import { hasPermission } from "@/lib/authorization";
import { unauthorized } from "next/navigation";
import BrandSheet from "@/components/forms/BrandSheet";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import BrandActionButtons from "@/components/ui/factory/form/BrandActionButtons";

export const metadata = {
  title: "Manage Brands | Admin Dashboard",
};

export default async function BrandsPage() {
  const canCreateBrands = await hasPermission("create", "brands");
  const canReadBrands = await hasPermission("read", "brands");
  const canUpdateBrands = await hasPermission("update", "brands");
  const canDeleteBrands = await hasPermission("delete", "brands");

  if (!canReadBrands) {
    return unauthorized();
  }

  const { data: brands } = await getShopBrands();
  const availableBrands = brands || [];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Brands Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage product brands with logos and details.</p>
        </div>
        {canCreateBrands && <BrandSheet />}
      </div>
      <Table>
        <TableCaption>Available Brands in Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[100px]">Logo</TableHead>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[100px]">Product Assignments</TableHead>
            <TableHead className="w-[50px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableBrands.map((brand, i) => {
            return (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">
                  {brand.image_url ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border">
                      <Image src={brand.image_url} alt={brand.name} fill className="object-contain" />
                    </div>
                  ) : (
                    <div className="h-12 w-12 flex items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
                      No logo
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell>{new Date(brand.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{brand.product_count || 0}</TableCell>
                <TableCell className="space-x-2">
                  <BrandActionButtons brand={brand} canUpdate={canUpdateBrands} canDelete={canDeleteBrands} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
