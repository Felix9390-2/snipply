import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SnippetCard from "@/components/snippet-card";
import { SnippetWithAuthor } from "@shared/schema";
import { Search, Filter } from "lucide-react";

export default function Browse() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [language, setLanguage] = useState("all");

  const { data: snippets = [], isLoading } = useQuery<SnippetWithAuthor[]>({
    queryKey: ["/api/snippets", { trending: sortBy === "trending" }],
  });

  const { data: searchResults = [], isLoading: isSearching } = useQuery<SnippetWithAuthor[]>({
    queryKey: ["/api/snippets/search", { q: searchQuery }],
    enabled: searchQuery.length > 2,
  });

  const filteredSnippets = searchQuery.length > 2 ? searchResults : snippets;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is triggered automatically by the query
  };

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Browse Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold mb-2" data-testid="browse-title">Browse Snippets</h1>
          <p className="text-muted-foreground" data-testid="browse-description">
            Discover amazing code snippets from the community
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-input"
              />
            </div>
          </form>
          
          {/* Filters */}
          <div className="flex space-x-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="likes">Most Liked</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="w-40" data-testid="language-select">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="html">HTML/CSS</SelectItem>
                <SelectItem value="javascript">JavaScript</SelectItem>
                <SelectItem value="react">React</SelectItem>
                <SelectItem value="vue">Vue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading || isSearching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-lg p-4 animate-pulse"
              data-testid={`loading-card-${i}`}
            >
              <div className="aspect-video bg-muted rounded mb-4"></div>
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded mb-4 w-2/3"></div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="h-6 w-6 bg-muted rounded-full"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
                <div className="flex space-x-4">
                  <div className="h-3 bg-muted rounded w-8"></div>
                  <div className="h-3 bg-muted rounded w-8"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredSnippets.length === 0 ? (
        <div className="text-center py-12" data-testid="no-results">
          <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No snippets found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try adjusting your search terms" : "No public snippets available yet"}
          </p>
        </div>
      ) : (
        <>
          {/* Search Results Info */}
          {searchQuery && (
            <div className="mb-6 p-4 bg-muted/30 rounded-lg" data-testid="search-results-info">
              <p className="text-sm text-muted-foreground">
                Found {filteredSnippets.length} snippet{filteredSnippets.length !== 1 ? 's' : ''} for "{searchQuery}"
              </p>
            </div>
          )}
          
          {/* Snippet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="snippets-grid">
            {filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                showAuthor={true}
              />
            ))}
          </div>
          
          {/* Load More */}
          {filteredSnippets.length >= 20 && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" data-testid="load-more">
                Load More Snippets
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
