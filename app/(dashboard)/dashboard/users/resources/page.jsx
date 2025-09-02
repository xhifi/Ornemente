import getAllResources from "@/data/dal/auth/resources/get-all-resources";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import ResourceActionButtons from "@/components/ui/factory/form/ResourceActionButtons";

import ResourceSheet from "@/components/forms/ResourceSheet";
import { unauthorized } from "next/navigation";
import { getServerSession } from "@/lib/auth-actions";

const ManageResourcesPage = async () => {
  const resourcesResult = await getAllResources({ includePermissionCount: true });

  const availableResources = resourcesResult.data || [];

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Resources Management</h3>
          <p className="text-sm text-muted-foreground">Define system resources that can be associated with permissions and roles.</p>
        </div>
        <ResourceSheet />
      </div>
      <Table>
        <TableCaption>Available Resources in Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[100px]">Permissions Assigned</TableHead>
            <TableHead className="w-[50px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableResources.map((resource, i) => {
            return (
              <TableRow key={resource.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">{resource.name}</TableCell>
                <TableCell>{new Date(resource.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{resource.permission_count || 0}</TableCell>
                <TableCell className={`space-x-2`}>
                  <ResourceActionButtons resource={resource} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default ManageResourcesPage;
