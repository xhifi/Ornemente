import getShopTypes from "@/data/dal/shop/get-shop-types";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TypeActionButtons from "@/components/ui/factory/form/TypeActionButtons";
import TypeSheet from "@/components/forms/TypeSheet";
import { hasPermission } from "@/lib/authorization";
import { unauthorized } from "next/navigation";

const ManageTypesPage = async () => {
  const canCreateTypes = await hasPermission("create", "types");
  const canReadTypes = await hasPermission("read", "types");
  const canUpdateTypes = await hasPermission("update", "types");
  const canDeleteTypes = await hasPermission("delete", "types");

  if (!canReadTypes) {
    return unauthorized();
  }

  const typesResult = await getShopTypes();
  const availableTypes = typesResult.data || [];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Types Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage product types and categories.</p>
        </div>
        {canCreateTypes && <TypeSheet />}
      </div>
      <Table>
        <TableCaption>Available Types in Database</TableCaption>
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
          {availableTypes.map((type, i) => {
            return (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell>{new Date(type.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{type.product_count || 0}</TableCell>
                <TableCell className="space-x-2">
                  <TypeActionButtons type={type} canUpdate={canUpdateTypes} canDelete={canDeleteTypes} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default ManageTypesPage;
