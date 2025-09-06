import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SnippetCard from "@/components/snippet-card";
import { SnippetWithAuthor } from "@shared/schema";
import { Trophy, Eye, Heart, TrendingUp, Calendar, Clock } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

export default function Trending() {
  const [timeframe, setTimeframe] = useState("week");

  const { data: trendingSnippets = [], isLoading } = useQuery<SnippetWithAuthor[]>({
    queryKey: ["/api/snippets", { trending: true }],
  });

  const topSnippet = trendingSnippets[0];
  const otherTrending = trendingSnippets.slice(1, 11); // Top 10 excluding the first

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center" data-testid="trending-title">
            <TrendingUp className="mr-2 h-6 w-6 text-primary" />
            Trending Snippets
          </h1>
          <p className="text-muted-foreground" data-testid="trending-description">
            Most popular snippets this week
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={timeframe === "week" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("week")}
            data-testid="timeframe-week"
          >
            This Week
          </Button>
          <Button
            variant={timeframe === "month" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("month")}
            data-testid="timeframe-month"
          >
            This Month
          </Button>
          <Button
            variant={timeframe === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeframe("all")}
            data-testid="timeframe-all"
          >
            All Time
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {/* Featured Snippet Skeleton */}
          <Card className="animate-pulse">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-video bg-muted rounded-lg"></div>
                <div className="space-y-4">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-8 bg-muted rounded-full"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Trending List Skeleton */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center bg-card border border-border rounded-lg p-4 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded mr-4"></div>
                <div className="w-16 h-16 bg-muted rounded-lg mr-4"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-12"></div>
                  <div className="h-3 bg-muted rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : trendingSnippets.length === 0 ? (
        <div className="text-center py-12" data-testid="no-trending">
          <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No trending snippets</h3>
          <p className="text-muted-foreground mb-4">
            No snippets are trending right now. Be the first to create something amazing!
          </p>
          <Link href="/editor">
            <Button>Create a Snippet</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Featured Snippet */}
          {topSnippet && (
            <Card className="overflow-hidden" data-testid="featured-snippet">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Trophy className="text-yellow-500 text-xl" />
                  <h2 className="text-lg font-semibold">Snippet of the Week</h2>
                  <Badge variant="secondary">#{1}</Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
                    <iframe
                      srcDoc={`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <style>${topSnippet.css}</style>
                        </head>
                        <body>
                          ${topSnippet.html}
                          <script>${topSnippet.javascript}</script>
                        </body>
                        </html>
                      `}
                      className="w-full h-full border-0"
                      title={`Preview of ${topSnippet.title}`}
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h3 className="text-xl font-bold mb-3" data-testid="featured-title">
                      {topSnippet.title}
                    </h3>
                    <p className="text-muted-foreground mb-4" data-testid="featured-description">
                      {topSnippet.description || "An amazing code snippet that's trending this week."}
                    </p>
                    <div className="flex items-center space-x-4 mb-4">
                      <Link href={`/profile/${topSnippet.author.username}`} className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={topSnippet.author.profilePicture || topSnippet.author.avatarUrl || undefined} alt={topSnippet.author.displayName || undefined} />
                          <AvatarFallback>
                            {(topSnippet.author.displayName || topSnippet.author.username)[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium" data-testid="featured-author">
                          {topSnippet.author.displayName || topSnippet.author.username}
                        </span>
                      </Link>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <span className="flex items-center" data-testid="featured-views">
                          <Eye className="h-4 w-4 mr-1" />
                          {topSnippet.views.toLocaleString()}
                        </span>
                        <span className="flex items-center" data-testid="featured-likes">
                          <Heart className="h-4 w-4 mr-1 text-red-500" />
                          {topSnippet.likes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <Link href={`/editor/${topSnippet.id}`}>
                      <Button className="w-fit" data-testid="view-featured">
                        View Snippet
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trending Rankings */}
          {otherTrending.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold" data-testid="rankings-title">Top Trending</h2>
              <div className="space-y-3" data-testid="trending-list">
                {otherTrending.map((snippet, index) => (
                  <Card key={snippet.id} className="group hover:shadow-lg transition-shadow" data-testid={`trending-item-${index + 2}`}>
                    <CardContent className="p-4">
                      <Link href={`/editor/${snippet.id}`} className="block">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold">
                            {index + 2}
                          </div>
                          
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden flex-shrink-0">
                            <iframe
                              srcDoc={`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                  <style>${snippet.css}</style>
                                </head>
                                <body style="margin:0;padding:4px;font-size:8px;">
                                  ${snippet.html}
                                  <script>${snippet.javascript}</script>
                                </body>
                                </html>
                              `}
                              className="w-full h-full border-0 pointer-events-none"
                              title={`Preview of ${snippet.title}`}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors truncate" data-testid={`trending-title-${index + 2}`}>
                              {snippet.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2 line-clamp-1" data-testid={`trending-description-${index + 2}`}>
                              {snippet.description || "A trending code snippet"}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={snippet.author.avatarUrl || undefined} alt={snippet.author.displayName || undefined} />
                                <AvatarFallback className="text-xs">
                                  {(snippet.author.displayName || snippet.author.username)[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground truncate" data-testid={`trending-author-${index + 2}`}>
                                {snippet.author.displayName || snippet.author.username}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end space-y-1 text-sm text-muted-foreground flex-shrink-0">
                            <span className="flex items-center" data-testid={`trending-views-${index + 2}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              {snippet.views.toLocaleString()}
                            </span>
                            <span className="flex items-center" data-testid={`trending-likes-${index + 2}`}>
                              <Heart className="h-4 w-4 mr-1" />
                              {snippet.likes.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* More Trending Snippets Grid */}
          {trendingSnippets.length > 11 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">More Trending</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingSnippets.slice(11).map((snippet) => (
                  <SnippetCard
                    key={snippet.id}
                    snippet={snippet}
                    showAuthor={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
