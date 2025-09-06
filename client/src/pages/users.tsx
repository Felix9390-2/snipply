import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Users as UsersIcon, Shield, UserX, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface UserWithoutPassword extends Omit<User, 'password'> {}

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = user?.rank === 'admin';

  // Fetch all users or search results
  const { data: users = [], isLoading } = useQuery<UserWithoutPassword[]>({
    queryKey: searchQuery ? ["/api/admin/users", { search: searchQuery }] : ["/api/admin/users"],
    enabled: isAdmin,
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "User and all their content has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  // Promote/demote user mutation
  const updateRankMutation = useMutation({
    mutationFn: async ({ userId, rank }: { userId: string; rank: 'admin' | 'default' }) => {
      await apiRequest("PATCH", `/api/admin/users/${userId}/rank`, { rank });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Rank updated",
        description: "User rank has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user rank",
        variant: "destructive",
      });
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleDeleteUser = (userId: string, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}" and all their content? This action cannot be undone.`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  const handleUpdateRank = (userId: string, currentRank: string) => {
    const newRank = currentRank === 'admin' ? 'default' : 'admin';
    const action = newRank === 'admin' ? 'promote' : 'demote';
    
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      updateRankMutation.mutate({ userId, rank: newRank });
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">
              You need administrator privileges to view the users list.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center gap-2" data-testid="users-title">
            <UsersIcon className="h-6 w-6" />
            Users Management
          </h1>
          <p className="text-muted-foreground" data-testid="users-description">
            Search and manage all users in the system
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search users by name, username, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-users-input"
          />
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-20" />
                    <div className="h-3 bg-muted rounded w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Users Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow" data-testid={`user-card-${user.id}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage 
                        src={user.avatarUrl || user.profilePicture || undefined} 
                        alt={user.displayName || user.username} 
                      />
                      <AvatarFallback>
                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <Link href={`/profile/${user.username}`}>
                        <h3 className="font-semibold hover:text-primary cursor-pointer truncate" data-testid={`user-name-${user.id}`}>
                          {user.displayName || user.username}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </div>
                  
                  {user.id !== user.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" data-testid={`user-menu-${user.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleUpdateRank(user.id, user.rank)}>
                          {user.rank === 'admin' ? 'Demote to User' : 'Promote to Admin'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteUser(user.id, user.username)}
                          className="text-destructive"
                        >
                          <UserX className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rank:</span>
                    <Badge variant={user.rank === 'admin' ? 'default' : 'secondary'}>
                      {user.rank === 'admin' && <Shield className="h-3 w-3 mr-1" />}
                      {user.rank}
                    </Badge>
                  </div>
                  
                  {user.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <span className="text-sm truncate max-w-[150px]">{user.email}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Joined:</span>
                    <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {user.bio && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground line-clamp-2">{user.bio}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Users Found */}
      {!isLoading && users.length === 0 && (
        <Card className="text-center">
          <CardContent className="pt-6">
            <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Users Found</h2>
            <p className="text-muted-foreground">
              {searchQuery ? "No users match your search criteria." : "No users found in the system."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}