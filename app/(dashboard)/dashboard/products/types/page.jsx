import getShopTypes from "@/data/dal/shop/get-shop-types";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TypeActionButtons from "@/components/ui/factory/form/TypeActionButtons";

import TypeDialog from "@/components/forms/TypeDialog";

const ManageTypesPage = async () => {
  const availableTypes = await getShopTypes();

  return (
    <>
      <div className="flex">
        <TypeDialog />
      </div>
      <Table>
        <TableCaption>Available Types in Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Assignments</TableHead>
            <TableHead className="w-[50px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableTypes.data.map((type, i) => {
            return (
              <TableRow key={type.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">{type.name}</TableCell>
                <TableCell>{new Date(type.created_at).toUTCString()}</TableCell>
                <TableCell>{type.product_count}</TableCell>
                <TableCell className={`space-x-2`}>
                  <TypeActionButtons type={type} />
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
