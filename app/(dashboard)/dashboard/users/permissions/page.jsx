import getAllPermissions from "@/data/dal/auth/permissions/get-all-permissions";
import getAllResources from "@/data/dal/auth/resources/get-all-resources";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PermissionActionButtons from "@/components/ui/factory/form/PermissionActionButtons";

import PermissionSheet from "@/components/forms/PermissionSheet";

const ManagePermissionsPage = async () => {
  const [permissionsResult, resourcesResult] = await Promise.all([getAllPermissions(), getAllResources()]);

  const availablePermissions = permissionsResult.permissions || [];
  const availableResources = resourcesResult.data || [];
  console.log(`Available Permissions:`, JSON.stringify(availablePermissions, null, 2));
  console.log(`Available Resources:`, availableResources);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Permissions Management</h3>
          <p className="text-sm text-muted-foreground">
            Create and manage system permissions. Define specific actions that users can perform.
          </p>
        </div>
        <PermissionSheet availableResources={availableResources} />
      </div>
      <Table>
        <TableCaption>Available Permissions in Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[200px]">Permission Name</TableHead>
            <TableHead className="w-[300px]">Associated Resources</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[50px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availablePermissions.map((permission, i) => {
            return (
              <TableRow key={permission.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">
                  {permission.name.includes(".") ? (
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{permission.name.split(".")[1]}</span>
                      <span className="text-xs text-muted-foreground">on {permission.name.split(".")[0]}</span>
                    </div>
                  ) : (
                    permission.name
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {permission.resources && permission.resources.length > 0 ? (
                      permission.resources.map((resource, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {resource.resource_name}
                        </span>
                      ))
                    ) : permission.name.includes(".") ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {permission.name.split(".")[0]}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">No resources assigned</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>{new Date(permission.created_at).toLocaleDateString()}</TableCell>
                <TableCell className={`space-x-2`}>
                  <PermissionActionButtons permission={permission} availableResources={availableResources} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default ManagePermissionsPage;
