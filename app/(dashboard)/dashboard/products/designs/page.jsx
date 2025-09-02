import getShopDesigns from "@/data/dal/shop/get-shop-designs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DesignActionButtons from "@/components/ui/factory/form/DesignActionButtons";
import DesignSheet from "@/components/forms/DesignSheet";
import { hasPermission } from "@/lib/authorization";
import { unauthorized } from "next/navigation";

export const metadata = {
  title: "Manage Designs | Admin Dashboard",
};

const ManageDesignsPage = async () => {
  const canCreateDesigns = await hasPermission("create", "designs");
  const canReadDesigns = await hasPermission("read", "designs");
  const canUpdateDesigns = await hasPermission("update", "designs");
  const canDeleteDesigns = await hasPermission("delete", "designs");

  if (!canReadDesigns) {
    return unauthorized();
  }

  const { data: designs } = await getShopDesigns();
  const availableDesigns = designs || [];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Designs Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage product designs available in your store.</p>
        </div>
        {canCreateDesigns && <DesignSheet />}
      </div>
      <Table>
        <TableCaption>Available Designs in Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[100px]">Product Assignments</TableHead>
            <TableHead className="w-[50px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableDesigns.map((design, i) => {
            return (
              <TableRow key={design.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">{design.name}</TableCell>
                <TableCell>{new Date(design.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{design.product_count || 0}</TableCell>
                <TableCell className="space-x-2">
                  <DesignActionButtons design={design} canUpdate={canUpdateDesigns} canDelete={canDeleteDesigns} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default ManageDesignsPage;
