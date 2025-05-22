"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  User,
  Crown,
  Book,
  BarChart2,
  Code,
} from "lucide-react";

// Navigation items based on user role
const navItems = {
  public: [
    { label: "Beranda", href: "/" },
    { label: "Tentang", href: "/about" },
    { label: "Fitur", href: "/features" },
    { label: "Kontak", href: "/contact" },
  ],
  student: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Game", href: "/game" },
    { label: "Belajar", href: "/study" },
    { label: "Tantangan", href: "/challenges" },
    { label: "Leaderboard", href: "/leaderboard" },
  ],
  teacher: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Siswa", href: "/students" },
    { label: "Konten", href: "/content" },
    { label: "Analitik", href: "/analytics" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Pengguna", href: "/admin/users" },
    { label: "Konten", href: "/admin/content" },
    { label: "Laporan", href: "/admin/reports" },
    { label: "Pengaturan", href: "/admin/settings" },
  ],
};

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Track scroll position to change header style
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Determine which nav items to show based on user role
  const getNavItems = () => {
    if (!user) return navItems.public;

    switch (user.role) {
      case "admin":
        return navItems.admin;
      case "teacher":
        return navItems.teacher;
      default:
        return navItems.student;
    }
  };

  const currentNavItems = getNavItems();

  // Handle logout click
  const handleLogout = async () => {
    try {
      await logout();
      // Will redirect via useAuth hook
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo - updated to use Lucide Code icon instead of Image */}
          <Link
            href="/"
            className="flex items-center space-x-2 font-pixel-heading"
          >
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-white transition-transform hover:rotate-12">
              <Code size={20} />
            </div>
            <span className="text-xl hidden sm:inline-block text-gradient">
              Gamifikasi CS
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {currentNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-pixel-body text-sm transition-colors hover:text-primary ${
                  pathname === item.href
                    ? "text-primary font-medium"
                    : "text-foreground/90"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right-side items: auth buttons or user menu */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <ThemeToggle />

            {user ? (
              /* Logged-in user controls */
              <div className="flex items-center space-x-3">
                {/* Notifications */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="relative"
                      aria-label="Notifikasi"
                    >
                      <Bell className="h-5 w-5" />

                      {/* Notification badge - will be conditionally rendered */}
                      <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <div className="p-4 text-center font-pixel-body">
                      <p>Notifikasi</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Lihat semua notifikasi
                      </p>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full border-2 border-border overflow-hidden hover:border-primary"
                      aria-label="User menu"
                    >
                      <Avatar>
                        <AvatarImage
                          src={user.avatarUrl || ""}
                          alt={user.username}
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-pixel-heading">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center gap-2 p-2">
                      <div className="flex flex-col space-y-0.5">
                        <p className="text-sm font-medium font-pixel-body">
                          {user.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate font-pixel-body">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" />
                        <span className="font-pixel-body">Profil</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/achievements" className="cursor-pointer">
                        <Crown className="w-4 h-4 mr-2" />
                        <span className="font-pixel-body">Achievements</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/study" className="cursor-pointer">
                        <Book className="w-4 h-4 mr-2" />
                        <span className="font-pixel-body">Materi Belajar</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/stats" className="cursor-pointer">
                        <BarChart2 className="w-4 h-4 mr-2" />
                        <span className="font-pixel-body">Statistik</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="cursor-pointer">
                        <Settings className="w-4 h-4 mr-2" />
                        <span className="font-pixel-body">Pengaturan</span>
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-danger hover:text-danger cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      <span className="font-pixel-body">Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              /* Public guest controls */
              <div className="flex items-center space-x-3">
                <Link
                  href="/auth/login"
                  className="font-pixel-body text-sm text-primary hover:text-primary/80"
                >
                  Login
                </Link>
                <Button asChild>
                  <Link href="/auth/register" className="font-pixel-body">
                    Daftar
                  </Link>
                </Button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden"
            >
              <div className="py-4 space-y-2">
                {currentNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block py-2 px-4 font-pixel-body rounded-md ${
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-primary/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                {user && (
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-danger hover:text-danger hover:bg-danger/10 font-pixel-body"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
