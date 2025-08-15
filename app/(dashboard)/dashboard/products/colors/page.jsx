import getShopColors from "@/data/dal/shop/get-shop-colors";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ColorActionButtons from "@/components/ui/factory/form/ColorActionButtons";
import ColorDialog from "@/components/forms/ColorDialog";

const ManageColorsPage = async () => {
  const availableColors = await getShopColors();

  return (
    <>
      <div className="flex">
        <ColorDialog />
      </div>
      <Table>
        <TableCaption>Available Types in Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead className="w-[100px]">Preview</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Assignments</TableHead>
            <TableHead className="w-[50px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableColors.data.map((color, i) => {
            return (
              <TableRow key={color.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">{color.name}</TableCell>
                <TableCell className="font-medium">
                  <span className="flex items-center space-x-1">
                    {color.hex.map((hexColor, index) => (
                      <div key={index} className="w-6 h-6 border border-primary" style={{ backgroundColor: hexColor }} />
                    ))}
                  </span>
                </TableCell>
                <TableCell>{new Date(color.created_at).toUTCString()}</TableCell>
                <TableCell>{color.product_count}</TableCell>
                <TableCell>
                  <ColorActionButtons color={color} />
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
