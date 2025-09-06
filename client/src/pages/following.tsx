import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { User } from "@shared/schema";
import { Users, UserCheck } from "lucide-react";

export default function Following() {
  const { data: following = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/following"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Following
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-8 bg-muted rounded w-20"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center" data-testid="following-title">
            <Users className="mr-2 h-5 w-5" />
            Following ({following.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {following.length === 0 ? (
            <div className="text-center py-12" data-testid="no-following">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Not following anyone yet</h3>
              <p className="text-muted-foreground mb-4">
                Start following other developers to see their latest snippets in your feed!
              </p>
              <Link href="/browse">
                <Button data-testid="browse-users-button">
                  Browse Users
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4" data-testid="following-list">
              {following.map((user) => (
                <div key={user.id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors" data-testid={`following-user-${user.id}`}>
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user.profilePicture || user.avatarUrl || undefined} alt={user.displayName || undefined} />
                    <AvatarFallback>
                      {(user.displayName || user.username)[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold" data-testid={`user-name-${user.id}`}>
                      {user.displayName || user.username}
                    </h4>
                    <p className="text-sm text-muted-foreground" data-testid={`user-username-${user.id}`}>
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`user-bio-${user.id}`}>
                        {user.bio}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <UserCheck className="h-4 w-4 mr-1" />
                      Following
                    </div>
                    <Link href={`/profile/${user.username}`}>
                      <Button variant="outline" size="sm" data-testid={`view-profile-${user.id}`}>
                        View Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}