import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Code, Grid3X3, TrendingUp, LogOut, User, Settings, Users, Bell, Shield } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();

  // Fetch unread notification count for authenticated users
  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const unreadCount = unreadCountData?.count || 0;
  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
          <Code className="text-primary text-xl" />
          <span className="text-xl font-bold">Snipply</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/editor" data-testid="nav-editor">
            <Button 
              variant="ghost" 
              className={`text-muted-foreground hover:text-foreground ${isActive('/editor') ? 'text-primary' : ''}`}
            >
              <Code className="mr-2 h-4 w-4" />
              Editor
            </Button>
          </Link>
          
          <Link href="/browse" data-testid="nav-browse">
            <Button 
              variant="ghost" 
              className={`text-muted-foreground hover:text-foreground ${isActive('/browse') ? 'text-primary' : ''}`}
            >
              <Grid3X3 className="mr-2 h-4 w-4" />
              Browse
            </Button>
          </Link>
          
          <Link href="/trending" data-testid="nav-trending">
            <Button 
              variant="ghost" 
              className={`text-muted-foreground hover:text-foreground ${isActive('/trending') ? 'text-primary' : ''}`}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </Button>
          </Link>
          
          {isAuthenticated && (
            <Link href="/inbox" data-testid="nav-inbox">
              <Button 
                variant="ghost" 
                className={`relative text-muted-foreground hover:text-foreground ${isActive('/inbox') ? 'text-primary' : ''}`}
              >
                <Bell className="mr-2 h-4 w-4" />
                Inbox
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full" data-testid="user-menu">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePicture || user?.avatarUrl || undefined} alt={user?.displayName || undefined} />
                  <AvatarFallback>{user?.displayName?.[0] || user?.username[0]}</AvatarFallback>
                </Avatar>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <div className="flex items-center justify-start gap-2 p-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profilePicture || user?.avatarUrl || undefined} alt={user?.displayName || undefined} />
                  <AvatarFallback>{user?.displayName?.[0] || user?.username[0]}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-1 leading-none">
                  <p className="font-medium">{user?.displayName || user?.username}</p>
                  <p className="w-[200px] truncate text-sm text-muted-foreground">
                    @{user?.username}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user?.username}`} data-testid="menu-profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/following" data-testid="menu-following">
                  <Users className="mr-2 h-4 w-4" />
                  Following
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/inbox" data-testid="menu-inbox" className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <Bell className="mr-2 h-4 w-4" />
                    Inbox
                  </div>
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Link>
              </DropdownMenuItem>
              {user?.rank === 'admin' && (
                <DropdownMenuItem asChild>
                  <Link href="/users" data-testid="menu-admin-users">
                    <Shield className="mr-2 h-4 w-4" />
                    Manage Users
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} data-testid="menu-logout">
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Link href="/login" data-testid="nav-login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link href="/signup" data-testid="nav-signup">
              <Button>Sign Up</Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
