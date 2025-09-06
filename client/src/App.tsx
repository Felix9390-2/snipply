import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/navbar";
import Home from "@/pages/home";
import Editor from "@/pages/editor";
import Browse from "@/pages/browse";
import Trending from "@/pages/trending";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import Profile from "@/pages/profile";
import Following from "@/pages/following";
import Inbox from "@/pages/inbox";
import Users from "@/pages/users";
import Remix from "@/pages/remix";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/editor" component={Editor} />
        <Route path="/editor/:id" component={Editor} />
        <Route path="/browse" component={Browse} />
        <Route path="/trending" component={Trending} />
        <Route path="/login" component={Login} />
        <Route path="/signup" component={Signup} />
        <Route path="/profile/:username" component={Profile} />
        <Route path="/following" component={Following} />
        <Route path="/inbox" component={Inbox} />
        <Route path="/users" component={Users} />
        <Route path="/remix/:id" component={Remix} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
