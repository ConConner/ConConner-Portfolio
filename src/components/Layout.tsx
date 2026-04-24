// src/components/Layout.tsx
import { memo, type PropsWithChildren } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ModeToggle } from "./mode-toggle";
import { useNavigationType } from "react-router-dom";
import { useEffect } from "react";

function useScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === "PUSH") {
      window.scrollTo(0, 0);
    }
    // POP (back/forward) leaves scroll as-is
  }, [location, navigationType]);
}

const NAV_ITEMS = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About" },
  { path: "/projects", label: "Projects" },
  { path: "/contact", label: "Contact" },
] as const;

type NavItem = (typeof NAV_ITEMS)[number];

const Logo = memo(function Logo() {
  return (
    <Link
      to="/"
      className="group flex shrink-0 items-center gap-2.5 font-semibold transition-opacity hover:opacity-80"
    >
      <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20 transition-shadow group-hover:shadow-md">
        <span className="text-sm font-bold">C⁴</span>
      </div>
      <span className="hidden bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent sm:inline">
        ConConner's Crazy Content
      </span>
    </Link>
  );
});

const DesktopNavItem = memo(function DesktopNavItem({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink
        asChild
        className={cn(
          navigationMenuTriggerStyle(),
          "relative bg-transparent font-medium transition-colors",
          isActive
            ? "text-primary after:absolute after:bottom-1 after:left-3 after:right-3 after:h-0.5 after:rounded-full after:bg-primary after:content-['']"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Link to={item.path}>{item.label}</Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
});

const MobileNavItem = memo(function MobileNavItem({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: boolean;
}) {
  return (
    <Link to={item.path}>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className={cn(
          "w-full justify-start font-medium",
          isActive && "bg-primary/10 text-primary hover:bg-primary/15",
        )}
      >
        {item.label}
      </Button>
    </Link>
  );
});

export function Layout({ children }: PropsWithChildren) {
  useScrollRestoration();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Logo />

          {/* Mobile controls */}
          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 p-6">
                <Link
                  to="/"
                  className="mb-6 flex items-center gap-2.5 font-semibold"
                >
                  <div className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground shadow-sm">
                    <span className="text-sm font-bold">C⁴</span>
                  </div>
                  <span>ConConner's Crazy Content</span>
                </Link>
                <Separator className="mb-4" />
                <nav className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => (
                    <MobileNavItem
                      key={item.path}
                      item={item}
                      isActive={pathname === item.path}
                    />
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop nav */}
          <div className="hidden items-center gap-2 md:flex">
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                {NAV_ITEMS.map((item) => (
                  <DesktopNavItem
                    key={item.path}
                    item={item}
                    isActive={pathname === item.path}
                  />
                ))}
              </NavigationMenuList>
            </NavigationMenu>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
