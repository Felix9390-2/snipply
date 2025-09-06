import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Heart, Eye, Edit, Share, Code2 } from "lucide-react";
import { SnippetWithAuthor } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface SnippetCardProps {
  snippet: SnippetWithAuthor;
  showAuthor?: boolean;
  showActions?: boolean;
  showRemix?: boolean;
}

export default function SnippetCard({ snippet, showAuthor = true, showActions = false, showRemix = true }: SnippetCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (snippet.isLiked) {
        await apiRequest("DELETE", `/api/snippets/${snippet.id}/like`);
      } else {
        await apiRequest("POST", `/api/snippets/${snippet.id}/like`);
      }
    },
    onSuccess: () => {
      // Invalidate all snippet-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/my-snippets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: snippet.isLiked ? "Unliked snippet" : "Liked snippet",
        description: snippet.isLiked ? "Removed from favorites" : "Added to favorites",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    },
  });

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to like snippets",
        variant: "destructive",
      });
      return;
    }
    
    likeMutation.mutate();
  };

  const isOwner = user?.id === snippet.authorId;

  return (
    <Card className="group hover:shadow-lg transition-shadow overflow-hidden" data-testid={`snippet-card-${snippet.id}`}>
      <Link href={`/editor/${snippet.id}`}>
        <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
          <iframe
            srcDoc={`
              <!DOCTYPE html>
              <html>
              <head>
                <style>${snippet.css}</style>
              </head>
              <body>
                ${snippet.html}
                <script>${snippet.javascript}</script>
              </body>
              </html>
            `}
            className="w-full h-full border-0 pointer-events-none"
            title={`Preview of ${snippet.title}`}
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              className="h-8 w-8 p-0"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              data-testid={`like-button-${snippet.id}`}
            >
              <Heart 
                className={`h-4 w-4 ${snippet.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </Button>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Link href={`/editor/${snippet.id}`}>
            <h3 className="font-semibold hover:text-primary transition-colors" data-testid={`snippet-title-${snippet.id}`}>
              {snippet.title}
            </h3>
          </Link>
          {!snippet.isPublic && (
            <Badge variant="secondary" className="ml-2">Private</Badge>
          )}
        </div>

        {snippet.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`snippet-description-${snippet.id}`}>
            {snippet.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          {showAuthor && (
            <Link href={`/profile/${snippet.author.username}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <Avatar className="h-6 w-6">
                <AvatarImage src={snippet.author.profilePicture || snippet.author.avatarUrl || undefined} alt={snippet.author.displayName || undefined} />
                <AvatarFallback className="text-xs">
                  {(snippet.author.displayName || snippet.author.username)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-muted-foreground" data-testid={`snippet-author-${snippet.id}`}>
                {snippet.author.displayName || snippet.author.username}
              </span>
            </Link>
          )}

          <div className="flex items-center space-x-3 text-sm text-muted-foreground">
            <span className="flex items-center" data-testid={`snippet-views-${snippet.id}`}>
              <Eye className="h-4 w-4 mr-1" />
              {snippet.views}
            </span>
            <span className="flex items-center" data-testid={`snippet-likes-${snippet.id}`}>
              <Heart className="h-4 w-4 mr-1" />
              {snippet.likes}
            </span>
          </div>
        </div>

        {((showActions && isOwner) || showRemix) && (
          <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-border">
            {showRemix && (
              <Link href={`/remix/${snippet.id}`}>
                <Button size="sm" variant="outline" data-testid={`remix-button-${snippet.id}`}>
                  <Code2 className="h-4 w-4 mr-1" />
                  Remix
                </Button>
              </Link>
            )}
            {showActions && isOwner && (
              <>
                <Link href={`/editor/${snippet.id}`}>
                  <Button size="sm" variant="outline" data-testid={`edit-button-${snippet.id}`}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                </Link>
                <Button size="sm" variant="outline" data-testid={`share-button-${snippet.id}`}>
                  <Share className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
