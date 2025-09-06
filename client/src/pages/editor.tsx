import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import CodeEditor from "@/components/code-editor";
import LivePreview from "@/components/live-preview";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Play, Save, Share, Monitor, Smartphone, Tablet, FolderOpen, Eye, Heart, Plus, AlertTriangle, Maximize, X } from "lucide-react";
import { Snippet, InsertSnippet, SnippetWithAuthor } from "@shared/schema";

export default function Editor() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("Untitled Snippet");
  const [description, setDescription] = useState("");
  const [html, setHtml] = useState("");
  const [css, setCss] = useState("");
  const [javascript, setJavascript] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [activeTab, setActiveTab] = useState("html");
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [newProjectDialogOpen, setNewProjectDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load existing snippet if ID is provided
  const { data: snippet, isLoading } = useQuery<Snippet>({
    queryKey: ["/api/snippets", id],
    enabled: !!id,
  });

  // Load user's own snippets for load dialog
  const { data: mySnippets = [], isLoading: mySnippetsLoading } = useQuery<SnippetWithAuthor[]>({
    queryKey: ["/api/my-snippets"],
    enabled: loadDialogOpen && isAuthenticated,
  });

  // Load existing snippet if ID is provided
  useEffect(() => {
    if (snippet) {
      setTitle(snippet.title);
      setDescription(snippet.description || "");
      setHtml(snippet.html);
      setCss(snippet.css);
      setJavascript(snippet.javascript);
      setIsPublic(snippet.isPublic);
    }
  }, [snippet]);

  // Save editor state to sessionStorage on changes
  useEffect(() => {
    const editorState = {
      title,
      description,
      html,
      css,
      javascript,
      isPublic,
      activeTab,
      snippetId: id
    };
    sessionStorage.setItem('editor-state', JSON.stringify(editorState));
  }, [title, description, html, css, javascript, isPublic, activeTab, id]);

  // Restore editor state from sessionStorage on mount (only if no snippet is being loaded)
  useEffect(() => {
    if (!id && !snippet) {
      try {
        const savedState = sessionStorage.getItem('editor-state');
        if (savedState) {
          const state = JSON.parse(savedState);
          // Only restore if it's not a different snippet and has content
          if (!state.snippetId && (state.html || state.css || state.javascript || (state.title && state.title !== "Untitled Snippet"))) {
            setTitle(state.title || "Untitled Snippet");
            setDescription(state.description || "");
            setHtml(state.html || "");
            setCss(state.css || "");
            setJavascript(state.javascript || "");
            setIsPublic(state.isPublic || false);
            setActiveTab(state.activeTab || "html");
            console.log('Restored editor state from session');
          }
        }
      } catch (error) {
        console.warn('Failed to restore editor state:', error);
      }
    }
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (snippetData: InsertSnippet) => {
      if (id && snippet) {
        // Update existing snippet
        const res = await apiRequest("PATCH", `/api/snippets/${id}`, snippetData);
        return res.json();
      } else {
        // Create new snippet
        const res = await apiRequest("POST", "/api/snippets", snippetData);
        return res.json();
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/snippets"] });
      toast({
        title: "Success",
        description: id ? "Snippet updated" : "Snippet saved",
      });
      
      if (!id) {
        setLocation(`/editor/${data.id}`);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save snippet",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to save snippets",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    saveMutation.mutate({
      title,
      description: description || undefined,
      html,
      css,
      javascript,
      isPublic,
    });
  };

  const handleShare = () => {
    if (id) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Snippet link copied to clipboard",
      });
    } else {
      toast({
        title: "Save first",
        description: "Please save the snippet before sharing",
        variant: "destructive",
      });
    }
  };

  const handleLoadSnippet = (snippetToLoad: SnippetWithAuthor) => {
    setTitle(snippetToLoad.title);
    setDescription(snippetToLoad.description || "");
    setHtml(snippetToLoad.html);
    setCss(snippetToLoad.css);
    setJavascript(snippetToLoad.javascript);
    setIsPublic(snippetToLoad.isPublic);
    setLoadDialogOpen(false);
    setLocation(`/editor/${snippetToLoad.id}`);
  };

  const handleNewProject = () => {
    setTitle("Untitled Snippet");
    setDescription("");
    setHtml("");
    setCss("");
    setJavascript("");
    setIsPublic(false);
    setActiveTab("html");
    setNewProjectDialogOpen(false);
    setLocation("/editor");
  };

  const getPreviewClassName = () => {
    switch (previewDevice) {
      case "mobile":
        return "max-w-sm mx-auto";
      case "tablet":
        return "max-w-2xl mx-auto";
      default:
        return "w-full";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-80px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading snippet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Toolbar */}
      <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Snippet"
            className="max-w-xs"
            data-testid="snippet-title"
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="public"
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked as boolean)}
              data-testid="snippet-public"
            />
            <Label htmlFor="public" className="text-sm">
              Public
            </Label>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* New Project Button */}
          <Dialog open={newProjectDialogOpen} onOpenChange={setNewProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                data-testid="button-new-project"
              >
                <Plus className="mr-1 h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                  Start New Project?
                </DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <p className="text-muted-foreground mb-4">
                  This will clear your current work and start a new project. Any unsaved changes will be lost.
                </p>
                <div className="flex items-center justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setNewProjectDialogOpen(false)}
                    data-testid="cancel-new-project"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNewProject}
                    data-testid="confirm-new-project"
                  >
                    Start New Project
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {/* Run code */}}
            data-testid="button-run"
          >
            <Play className="mr-1 h-4 w-4" />
            Run
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save"
          >
            <Save className="mr-1 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            data-testid="button-share"
          >
            <Share className="mr-1 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex-1">
        <ResizablePanelGroup direction="horizontal">
          {/* Code Panels */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Code Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="html" data-testid="tab-html">
                    <span className="text-orange-500 mr-1">●</span>
                    HTML
                  </TabsTrigger>
                  <TabsTrigger value="css" data-testid="tab-css">
                    <span className="text-blue-400 mr-1">●</span>
                    CSS
                  </TabsTrigger>
                  <TabsTrigger value="javascript" data-testid="tab-js">
                    <span className="text-yellow-400 mr-1">●</span>
                    JS
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="html" className="flex-1 mt-0">
                  <CodeEditor
                    value={html}
                    onChange={setHtml}
                    language="html"
                    placeholder="<!-- Write your HTML here -->"
                  />
                </TabsContent>
                
                <TabsContent value="css" className="flex-1 mt-0">
                  <CodeEditor
                    value={css}
                    onChange={setCss}
                    language="css"
                    placeholder="/* Write your CSS here */"
                  />
                </TabsContent>
                
                <TabsContent value="javascript" className="flex-1 mt-0">
                  <CodeEditor
                    value={javascript}
                    onChange={setJavascript}
                    language="javascript"
                    placeholder="// Write your JavaScript here"
                  />
                </TabsContent>
              </Tabs>
              
              {/* Description */}
              <div className="p-2 border-t border-border">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your snippet..."
                  className="mt-1"
                  rows={2}
                  data-testid="snippet-description"
                />
              </div>
            </div>
          </ResizablePanel>
          
          <ResizableHandle />
          
          {/* Preview Panel */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="h-full flex flex-col">
              {/* Preview Toolbar */}
              <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">Preview</span>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant={previewDevice === "mobile" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPreviewDevice("mobile")}
                      data-testid="preview-mobile"
                    >
                      <Smartphone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === "tablet" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPreviewDevice("tablet")}
                      data-testid="preview-tablet"
                    >
                      <Tablet className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={previewDevice === "desktop" ? "default" : "ghost"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setPreviewDevice("desktop")}
                      data-testid="preview-desktop"
                    >
                      <Monitor className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setIsFullscreen(true)}
                      data-testid="preview-fullscreen"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {snippet && (
                  <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                    <span className="flex items-center" data-testid="snippet-views">
                      <Eye className="h-4 w-4 mr-1" /> {snippet.views}
                    </span>
                    <span className="flex items-center" data-testid="snippet-likes">
                      <Heart className="h-4 w-4 mr-1" /> {snippet.likes}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Preview Area */}
              <div className="flex-1 bg-background p-2">
                <div className={getPreviewClassName()}>
                  <LivePreview
                    html={html}
                    css={css}
                    javascript={javascript}
                  />
                </div>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Fullscreen Preview Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background">
          <div className="h-full flex flex-col">
            {/* Fullscreen Header */}
            <div className="bg-muted/30 border-b border-border px-4 py-2 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium">Fullscreen Preview</span>
                <span className="text-xs text-muted-foreground">{title}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                data-testid="close-fullscreen"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Fullscreen Preview Content */}
            <div className="flex-1 bg-background">
              <LivePreview
                html={html}
                css={css}
                javascript={javascript}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
