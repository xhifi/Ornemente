import getShopSizes from "@/data/dal/shop/get-shop-sizes";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SizeActionButtons from "@/components/ui/factory/form/SizeActionButtons";
import SizeSheet from "@/components/forms/SizeSheet";
import { hasPermission } from "@/lib/authorization";
import { unauthorized } from "next/navigation";

export const metadata = {
  title: "Manage Sizes | Admin Dashboard",
};

const ManageSizesPage = async () => {
  const canCreateSizes = await hasPermission("create", "sizes");
  const canReadSizes = await hasPermission("read", "sizes");
  const canUpdateSizes = await hasPermission("update", "sizes");
  const canDeleteSizes = await hasPermission("delete", "sizes");

  if (!canReadSizes) {
    return unauthorized();
  }

  const { data: sizes } = await getShopSizes();
  const availableSizes = sizes || [];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Sizes Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage product sizes available in your store.</p>
        </div>
        {canCreateSizes && <SizeSheet />}
      </div>
      <Table>
        <TableCaption>Available Sizes in Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[100px]">Code</TableHead>
            <TableHead className="w-[200px]">Label</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[100px]">Product Assignments</TableHead>
            <TableHead className="w-[50px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableSizes.map((size, i) => {
            return (
              <TableRow key={size.code}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">{size.code}</TableCell>
                <TableCell className="font-medium">{size.label || "—"}</TableCell>
                <TableCell>{new Date(size.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{size.product_count || 0}</TableCell>
                <TableCell className="space-x-2">
                  <SizeActionButtons size={size} canUpdate={canUpdateSizes} canDelete={canDeleteSizes} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default ManageSizesPage;
