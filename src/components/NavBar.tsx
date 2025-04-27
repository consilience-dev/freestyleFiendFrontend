import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth, signOut } from "@/lib/auth";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";

/**
 * Main site navigation bar for FreestyleFiend.
 * Modern, minimalist design with subtle animations.
 */
export function NavBar() {
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { authState } = useAuth();
  const router = useRouter();

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Link 
            href="/" 
            className="mr-6 flex items-center space-x-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 8C13.66 8 15 9.34 15 11V17C15 18.66 13.66 20 12 20C10.34 20 9 18.66 9 17V11C9 9.34 10.34 8 12 8ZM18 12C18 15.31 15.31 18 12 18V16C14.21 16 16 14.21 16 12H18Z" fill="currentColor" />
            </svg>
            <span className="hidden font-bold sm:inline-block">
              FreestyleFiend
            </span>
          </Link>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex">
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/record"
                className={`transition-colors hover:text-foreground/80 ${
                  router.pathname === "/record" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                Record
              </Link>
              <Link
                href="/vote"
                className={`transition-colors hover:text-foreground/80 ${
                  router.pathname === "/vote" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                Vote
              </Link>
              <Link
                href="/leaderboard"
                className={`transition-colors hover:text-foreground/80 ${
                  router.pathname === "/leaderboard" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                Leaderboard
              </Link>
            </nav>
          </div>
        </div>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          {authState.isAuthenticated ? (
            <>
              <Link href="/profile" className="mr-2">
                <Button variant="ghost" size="sm">
                  Profile
                </Button>
              </Link>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="default" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
          
          {/* Mobile menu button */}
          {isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                <path d="M3 18H21V16H3V18ZM3 13H21V11H3V13ZM3 6V8H21V6H3Z" fill="currentColor" />
              </svg>
              <span className="sr-only">Toggle menu</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMobile && menuOpen && (
        <div className="container pb-3 md:hidden">
          <nav className="flex flex-col space-y-3 text-sm">
            <Link
              href="/record"
              className="rounded-md px-3 py-2 hover:bg-accent"
              onClick={() => setMenuOpen(false)}
            >
              Record
            </Link>
            <Link
              href="/vote"
              className="rounded-md px-3 py-2 hover:bg-accent"
              onClick={() => setMenuOpen(false)}
            >
              Vote
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-md px-3 py-2 hover:bg-accent"
              onClick={() => setMenuOpen(false)}
            >
              Leaderboard
            </Link>
          </nav>
        </div>
      )}
    </nav>
  );
}
