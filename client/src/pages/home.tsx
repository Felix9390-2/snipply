import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Code, Users, Heart, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-80px)]">
      {/* Hero Section */}
      <section className="px-4 py-20 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="hero-title">
            Code. Share. Inspire.
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto" data-testid="hero-description">
            Snipply is the ultimate platform for creating, sharing, and discovering code snippets. 
            Build beautiful web experiments with our powerful editor and join a community of creators.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/editor" data-testid="cta-start-coding">
              <Button size="lg" className="w-full sm:w-auto">
                <Code className="mr-2 h-5 w-5" />
                Start Coding
              </Button>
            </Link>
            <Link href="/browse" data-testid="cta-explore">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Snippets
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-12" data-testid="features-title">
            Everything you need to create amazing code
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card data-testid="feature-editor">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Powerful Editor</h3>
                <p className="text-muted-foreground">
                  Write HTML, CSS, and JavaScript with syntax highlighting, auto-completion, and live preview.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-community">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Vibrant Community</h3>
                <p className="text-muted-foreground">
                  Share your creations, discover inspiring work, and connect with developers worldwide.
                </p>
              </CardContent>
            </Card>

            <Card data-testid="feature-social">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Social Features</h3>
                <p className="text-muted-foreground">
                  Like, comment, and save your favorite snippets. Build your reputation in the community.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold mb-4" data-testid="cta-title">
            Ready to start building?
          </h2>
          <p className="text-xl text-muted-foreground mb-8" data-testid="cta-description">
            Join thousands of developers already creating amazing things on Snipply.
          </p>
          <Link href="/signup" data-testid="cta-join">
            <Button size="lg">
              Join Snipply Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
