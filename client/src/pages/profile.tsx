import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import SnippetCard from "@/components/snippet-card";
import { UserProfile, SnippetWithAuthor } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { MapPin, Calendar, Link as LinkIcon, Code, Heart, Users, UserPlus, UserMinus, Camera } from "lucide-react";
import { useRef } from "react";

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/users", username],
    enabled: !!username,
  });

  const isOwnProfile = currentUser?.id === profile?.id;

  const { data: userSnippets = [], isLoading: snippetsLoading } = useQuery<SnippetWithAuthor[]>({
    queryKey: isOwnProfile ? ["/api/my-snippets"] : ["/api/snippets", { author: profile?.id }],
    enabled: !!profile?.id,
  });

  const { data: likedSnippets = [], isLoading: likedLoading } = useQuery<SnippetWithAuthor[]>({
    queryKey: ["/api/users", username, "liked"],
    enabled: !!username,
  });

  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async (action: 'follow' | 'unfollow') => {
      const method = action === 'follow' ? 'POST' : 'DELETE';
      return apiRequest(method, `/api/users/${username}/follow`);
    },
    onSuccess: (_, action) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
      toast({
        title: action === 'follow' ? "Following user" : "Unfollowed user", 
        description: action === 'follow' ? 
          `You are now following @${username}` : 
          `You are no longer following @${username}`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong",
      });
    },
  });

  // Profile picture upload mutation
  const profilePictureMutation = useMutation({
    mutationFn: async (profilePicture: string) => {
      return apiRequest('PUT', '/api/profile/picture', { profilePicture });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error updating profile picture",
        description: error.message || "Something went wrong",
      });
    },
  });

  const handleFollow = () => {
    if (profile?.isFollowing) {
      followMutation.mutate('unfollow');
    } else {
      followMutation.mutate('follow');
    }
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please choose an image smaller than 2MB",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please choose an image file",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      profilePictureMutation.mutate(result);
    };
    reader.readAsDataURL(file);
  };

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-2">User Not Found</h1>
            <p className="text-muted-foreground">The user @{username} doesn't exist.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Profile Header */}
      <Card className="mb-6" data-testid="profile-header">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-border">
                <AvatarImage src={profile.profilePicture || profile.avatarUrl || undefined} alt={profile.displayName || undefined} />
                <AvatarFallback className="text-2xl">
                  {(profile.displayName || profile.username)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={profilePictureMutation.isPending}
                    data-testid="upload-profile-picture"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureUpload}
                    className="hidden"
                    data-testid="profile-picture-input"
                  />
                </>
              )}
            </div>
            
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2" data-testid="profile-name">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-muted-foreground mb-3" data-testid="profile-username">
                @{profile.username}
              </p>
              {profile.bio && (
                <p className="text-muted-foreground mb-3" data-testid="profile-bio">
                  {profile.bio}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center" data-testid="profile-location">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center" data-testid="profile-joined">
                  <Calendar className="h-4 w-4 mr-1" />
                  Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </span>
                {profile.website && (
                  <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline"
                    data-testid="profile-website"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" />
                    {profile.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-center md:items-end space-y-4">
              {!isOwnProfile && currentUser && (
                <Button 
                  onClick={handleFollow} 
                  disabled={followMutation.isPending}
                  variant={profile.isFollowing ? "outline" : "default"}
                  data-testid="follow-button"
                >
                  {profile.isFollowing ? (
                    <>
                      <UserMinus className="mr-2 h-4 w-4" />
                      Unfollow
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Follow
                    </>
                  )}
                </Button>
              )}
              <div className="flex space-x-6 text-center">
                <div data-testid="profile-snippets-count">
                  <div className="font-semibold">{profile.snippetsCount}</div>
                  <div className="text-sm text-muted-foreground">Snippets</div>
                </div>
                <div data-testid="profile-followers-count">
                  <div className="font-semibold">{profile.followersCount}</div>
                  <div className="text-sm text-muted-foreground">Followers</div>
                </div>
                <div data-testid="profile-following-count">
                  <div className="font-semibold">{profile.followingCount}</div>
                  <div className="text-sm text-muted-foreground">Following</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Navigation */}
      <Tabs defaultValue="snippets" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:grid-cols-none lg:flex">
          <TabsTrigger value="snippets" className="flex items-center" data-testid="tab-snippets">
            <Code className="mr-2 h-4 w-4" />
            Snippets
          </TabsTrigger>
          <TabsTrigger value="liked" className="flex items-center" data-testid="tab-liked">
            <Heart className="mr-2 h-4 w-4" />
            Liked
          </TabsTrigger>
        </TabsList>

        <TabsContent value="snippets" className="space-y-6">
          {snippetsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                  <div className="aspect-video bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-muted rounded w-16"></div>
                    <div className="flex space-x-4">
                      <div className="h-3 bg-muted rounded w-8"></div>
                      <div className="h-3 bg-muted rounded w-8"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : userSnippets.length === 0 ? (
            <div className="text-center py-12" data-testid="no-snippets">
              <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {isOwnProfile ? "You haven't created any snippets yet" : `${profile.displayName || profile.username} hasn't created any snippets yet`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isOwnProfile ? "Start coding to see your snippets here!" : "Check back later for new content."}
              </p>
              {isOwnProfile && (
                <Button data-testid="create-first-snippet">
                  Create Your First Snippet
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="user-snippets">
              {userSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  showAuthor={false}
                  showActions={isOwnProfile}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="liked" className="space-y-6">
          {likedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                  <div className="aspect-video bg-muted rounded mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-3 bg-muted rounded w-16"></div>
                    <div className="flex space-x-4">
                      <div className="h-3 bg-muted rounded w-8"></div>
                      <div className="h-3 bg-muted rounded w-8"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : likedSnippets.length === 0 ? (
            <div className="text-center py-12" data-testid="liked-placeholder">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No liked snippets yet</h3>
              <p className="text-muted-foreground">
                {isOwnProfile ? "Like some snippets to see them here!" : "No liked snippets to show."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="liked-snippets">
              {likedSnippets.map((snippet) => (
                <SnippetCard
                  key={snippet.id}
                  snippet={snippet}
                  showAuthor={true}
                />
              ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
