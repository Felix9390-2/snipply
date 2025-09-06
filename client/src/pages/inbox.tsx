import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { NotificationWithDetails } from "@shared/schema";
import { Bell, BellOff, Check, CheckCheck, Code } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function Inbox() {
  const { toast } = useToast();
  
  const { data: notifications = [], isLoading } = useQuery<NotificationWithDetails[]>({
    queryKey: ["/api/notifications"],
  });

  const { data: unreadCountData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
  });
  
  const unreadCount = unreadCountData?.count || 0;

  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      return apiRequest('PUT', `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PUT', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
      toast({
        title: "All notifications marked as read",
        description: "Your inbox is now up to date",
      });
    },
  });

  const handleMarkAsRead = (notificationId: string) => {
    markReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllReadMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="mr-2 h-5 w-5" />
              Inbox
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/3"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center" data-testid="inbox-title">
              <Bell className="mr-2 h-5 w-5" />
              Inbox
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2" data-testid="unread-count">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllReadMutation.isPending}
                data-testid="mark-all-read"
              >
                <CheckCheck className="mr-2 h-4 w-4" />
                Mark All Read
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12" data-testid="no-notifications">
              <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground mb-4">
                You'll receive notifications when people you follow post new snippets.
              </p>
              <Link href="/following">
                <Button data-testid="view-following-button">
                  Manage Following
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4" data-testid="notifications-list">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start space-x-4 p-4 border rounded-lg transition-colors ${
                    notification.isRead ? 'bg-background' : 'bg-muted/30 border-primary/20'
                  }`}
                  data-testid={`notification-${notification.id}`}
                >
                  <Avatar className="w-10 h-10 mt-1">
                    <AvatarImage 
                      src={notification.fromUser?.profilePicture || undefined} 
                      alt={notification.fromUser?.displayName || undefined} 
                    />
                    <AvatarFallback>
                      {notification.fromUser?.displayName?.[0] || notification.fromUser?.username[0] || 'N'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-sm" data-testid={`notification-title-${notification.id}`}>
                        {notification.title}
                      </h4>
                      {!notification.isRead && (
                        <Badge variant="default" className="ml-2 shrink-0" data-testid={`notification-unread-${notification.id}`}>
                          New
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2" data-testid={`notification-message-${notification.id}`}>
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span data-testid={`notification-time-${notification.id}`}>
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {notification.snippetId && (
                          <Link href={`/editor/${notification.snippetId}`}>
                            <Button variant="ghost" size="sm" data-testid={`view-snippet-${notification.id}`}>
                              <Code className="mr-1 h-3 w-3" />
                              View Snippet
                            </Button>
                          </Link>
                        )}
                        
                        {!notification.isRead && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                            disabled={markReadMutation.isPending}
                            data-testid={`mark-read-${notification.id}`}
                          >
                            <Check className="mr-1 h-3 w-3" />
                            Mark Read
                          </Button>
                        )}
                      </div>
                    </div>
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