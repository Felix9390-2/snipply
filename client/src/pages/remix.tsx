import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Code, Eye, Heart, ArrowLeft, Copy, ExternalLink } from "lucide-react";
import { Snippet, SnippetWithAuthor } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function Remix() {
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("preview");

  const { data: snippet, isLoading } = useQuery<SnippetWithAuthor>({
    queryKey: ["/api/snippets", id],
    enabled: !!id,
  });

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: `${type} code copied successfully`,
      });
    }).catch(() => {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-6 bg-muted rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-muted rounded w-2/3 mb-6"></div>
            <div className="aspect-video bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!snippet) {
    return (
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-12 text-center">
            <h1 className="text-2xl font-bold mb-2">Snippet Not Found</h1>
            <p className="text-muted-foreground mb-4">The snippet you're looking for doesn't exist or is private.</p>
            <Link href="/browse">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Browse
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Link href="/browse">
          <Button variant="outline" size="sm" className="mr-4" data-testid="back-to-browse">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Browse
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold" data-testid="remix-title">{snippet.title}</h1>
            {!snippet.isPublic && (
              <Badge variant="secondary">Private</Badge>
            )}
          </div>
          {snippet.description && (
            <p className="text-muted-foreground" data-testid="remix-description">
              {snippet.description}
            </p>
          )}
        </div>
        <Link href={`/editor/${snippet.id}`}>
          <Button data-testid="view-in-editor">
            <ExternalLink className="mr-2 h-4 w-4" />
            View in Editor
          </Button>
        </Link>
      </div>

      {/* Author Info */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Link href={`/profile/${snippet.author.username}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <Avatar className="h-10 w-10">
                <AvatarImage src={snippet.author.profilePicture || snippet.author.avatarUrl || undefined} alt={snippet.author.displayName || undefined} />
                <AvatarFallback>
                  {(snippet.author.displayName || snippet.author.username)[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold" data-testid="author-name">
                  {snippet.author.displayName || snippet.author.username}
                </p>
                <p className="text-sm text-muted-foreground">@{snippet.author.username}</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span className="flex items-center" data-testid="snippet-stats-views">
                <Eye className="h-4 w-4 mr-1" />
                {snippet.views} views
              </span>
              <span className="flex items-center" data-testid="snippet-stats-likes">
                <Heart className="h-4 w-4 mr-1" />
                {snippet.likes} likes
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code and Preview */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preview" data-testid="tab-preview">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="html" data-testid="tab-html">
            HTML
          </TabsTrigger>
          <TabsTrigger value="css" data-testid="tab-css">
            CSS
          </TabsTrigger>
          <TabsTrigger value="javascript" data-testid="tab-javascript">
            JavaScript
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preview">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Live Preview</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(`/editor/${snippet.id}`, '_blank')}
                data-testid="open-fullscreen"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Full Screen
              </Button>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden border">
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
                  className="w-full h-full border-0"
                  title={`Preview of ${snippet.title}`}
                  data-testid="code-preview"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="html">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">HTML</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(snippet.html, 'HTML')}
                data-testid="copy-html"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter 
                  language="html" 
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, fontSize: '14px' }}
                  data-testid="html-code"
                >
                  {snippet.html || '<!-- No HTML code -->\n'}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="css">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">CSS</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(snippet.css, 'CSS')}
                data-testid="copy-css"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter 
                  language="css" 
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, fontSize: '14px' }}
                  data-testid="css-code"
                >
                  {snippet.css || '/* No CSS code */\n'}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="javascript">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">JavaScript</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(snippet.javascript, 'JavaScript')}
                data-testid="copy-js"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg overflow-hidden">
                <SyntaxHighlighter 
                  language="javascript" 
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, fontSize: '14px' }}
                  data-testid="js-code"
                >
                  {snippet.javascript || '// No JavaScript code\n'}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}