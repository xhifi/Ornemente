import getShopColors from "@/data/dal/shop/get-shop-colors";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ColorActionButtons from "@/components/ui/factory/form/ColorActionButtons";
import ColorSheet from "@/components/forms/ColorSheet";
import { hasPermission } from "@/lib/authorization";
import { unauthorized } from "next/navigation";

const ManageColorsPage = async () => {
  const canCreateColors = await hasPermission("create", "colors");
  const canReadColors = await hasPermission("read", "colors");
  const canUpdateColors = await hasPermission("update", "colors");
  const canDeleteColors = await hasPermission("delete", "colors");

  if (!canReadColors) {
    return unauthorized();
  }

  const colorsResult = await getShopColors();
  const availableColors = colorsResult.data || [];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Colors Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage product colors with hex values and previews.</p>
        </div>
        {canCreateColors && <ColorSheet />}
      </div>
      <Table>
        <TableCaption>Available Colors in Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="w-[150px]">Color Preview</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[100px]">Product Assignments</TableHead>
            <TableHead className="w-[50px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableColors.map((color, i) => {
            return (
              <TableRow key={color.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">{color.name}</TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center space-x-1">
                    {color.hex.map((hexColor, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 border border-primary rounded-sm"
                        style={{ backgroundColor: hexColor }}
                        title={hexColor}
                      />
                    ))}
                  </span>
                </TableCell>
                <TableCell>{new Date(color.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{color.product_count || 0}</TableCell>
                <TableCell className="space-x-2">
                  <ColorActionButtons color={color} canUpdate={canUpdateColors} canDelete={canDeleteColors} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default ManageColorsPage;
