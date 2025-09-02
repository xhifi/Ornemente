import getAllUsers from "@/data/dal/auth/users/get-all-users";
import getAllRoles from "@/data/dal/auth/roles/get-all-roles";

import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import UserRoleManager from "@/components/ui/factory/form/UserRoleManager";

export const dynamic = "force-dynamic";

const ManageUsersPage = async () => {
  const [usersResult, rolesResult] = await Promise.all([
    getAllUsers({ limit: 100 }), // Get more users for management
    getAllRoles(),
  ]);

  const users = usersResult.users || [];
  const availableRoles = rolesResult.roles || [];

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-muted-foreground">Manage user roles and permissions</p>
      </div>

      <Table>
        <TableCaption>All Users in Database ({users.length} total)</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">#</TableHead>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="w-[250px]">Email</TableHead>
            <TableHead className="w-[120px]">Verified</TableHead>
            <TableHead className="w-[200px]">Current Roles</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, i) => {
            const userRoles = user.roles || [];
            const highestPriorityRole =
              userRoles.length > 0
                ? userRoles.reduce((highest, role) => (role.role_priority > highest.role_priority ? role : highest))
                : null;

            return (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell className="font-medium">
                  <div>
                    <div>{user.name || "No name"}</div>
                    {highestPriorityRole && (
                      <div className="text-xs text-muted-foreground">Priority: {highestPriorityRole.role_priority}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.email_verified ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.email_verified ? "Verified" : "Not Verified"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {userRoles.length > 0 ? (
                      userRoles.map((role, idx) => (
                        <span
                          key={idx}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mr-1 ${
                            role.role_priority <= 10
                              ? "bg-red-100 text-red-800"
                              : role.role_priority <= 30
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {role.role_name}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">No roles</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <UserRoleManager user={user} availableRoles={availableRoles} currentRoles={userRoles} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
};

export default ManageUsersPage;
