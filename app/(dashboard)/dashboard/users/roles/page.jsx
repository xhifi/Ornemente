import getAllRoles from "@/data/dal/auth/roles/get-all-roles";
import getAllPermissions from "@/data/dal/auth/permissions/get-all-permissions";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import RoleActionButtons from "@/components/ui/factory/form/RoleActionButtons";

import RoleDialog from "@/components/forms/RoleDialog";

const ManageRolesPage = async () => {
  const [rolesResult, permissionsResult] = await Promise.all([getAllRoles({ includeUserCount: true }), getAllPermissions()]);

  if (rolesResult.error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">Error Loading Roles</h2>
          <p className="text-muted-foreground">{rolesResult.error}</p>
        </div>
      </div>
    );
  }

  if (permissionsResult.error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-destructive">Error Loading Permissions</h2>
          <p className="text-muted-foreground">{permissionsResult.error}</p>
        </div>
      </div>
    );
  }

  const availableRoles = rolesResult.roles || [];
  const availablePermissions = permissionsResult.permissions || [];

  return (
    <>
      <div className="flex">
        <RoleDialog availablePermissions={availablePermissions} />
      </div>
      <Table>
        <TableCaption>Available Roles in Database</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[150px]">Name</TableHead>
            <TableHead className="w-[100px]">Priority</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="w-[100px]">Users Assigned</TableHead>
            <TableHead className="w-[50px]">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {availableRoles.map((role, i) => {
            return (
              <TableRow key={role.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell className="font-medium">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      role.priority <= 10
                        ? "bg-red-100 text-red-800"
                        : role.priority <= 30
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {role.priority}
                  </span>
                </TableCell>
                <TableCell>{new Date(role.created_at).toLocaleDateString()}</TableCell>
                <TableCell>{role.user_count || 0}</TableCell>
                <TableCell className={`space-x-2`}>
                  <RoleActionButtons role={role} availablePermissions={availablePermissions} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default ManageRolesPage;
