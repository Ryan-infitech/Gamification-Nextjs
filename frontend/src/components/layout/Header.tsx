import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import { Menu, Transition } from "@headlessui/react";
import { useAuthStore } from "@/store/authStore";

export default function Header() {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { user, isAuthenticated, clearUser } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      clearUser();
      toast.success("Logged out successfully");
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error logging out");
    }
  };

  return (
    <header className="bg-gray-800 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.png"
              alt="CodeQuest Pixels"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <span className="text-xl font-bold text-white">
              CodeQuest Pixels
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm text-gray-300 hover:text-white ${
                router.pathname === "/" ? "text-white" : ""
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`text-sm text-gray-300 hover:text-white ${
                router.pathname === "/about" ? "text-white" : ""
              }`}
            >
              About
            </Link>
            <Link
              href="/features"
              className={`text-sm text-gray-300 hover:text-white ${
                router.pathname === "/features" ? "text-white" : ""
              }`}
            >
              Features
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-sm text-gray-300 hover:text-white ${
                    router.pathname === "/dashboard" ? "text-white" : ""
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/game"
                  className={`text-sm text-gray-300 hover:text-white ${
                    router.pathname === "/game" ? "text-white" : ""
                  }`}
                >
                  Play Game
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`text-sm text-gray-300 hover:text-white ${
                    router.pathname === "/login" ? "text-white" : ""
                  }`}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* User Menu (if logged in) */}
          {isAuthenticated && (
            <div className="hidden md:block">
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center space-x-2 text-gray-300 hover:text-white">
                  <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden">
                    {user?.avatarUrl ? (
                      <Image
                        src={user.avatarUrl}
                        alt={user.username || "User"}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </div>
                  <span>{user?.username || "User"}</span>
                </Menu.Button>

                <Transition
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-gray-700 py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile"
                          className={`${
                            active ? "bg-gray-600" : ""
                          } block px-4 py-2 text-sm text-gray-200`}
                        >
                          Your Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/inventory"
                          className={`${
                            active ? "bg-gray-600" : ""
                          } block px-4 py-2 text-sm text-gray-200`}
                        >
                          Inventory
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/settings"
                          className={`${
                            active ? "bg-gray-600" : ""
                          } block px-4 py-2 text-sm text-gray-200`}
                        >
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? "bg-gray-600" : ""
                          } block w-full text-left px-4 py-2 text-sm text-gray-200`}
                        >
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-white focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-700">
            <div className="flex flex-col space-y-4">
              <Link
                href="/"
                className={`text-sm text-gray-300 hover:text-white ${
                  router.pathname === "/" ? "text-white" : ""
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                className={`text-sm text-gray-300 hover:text-white ${
                  router.pathname === "/about" ? "text-white" : ""
                }`}
              >
                About
              </Link>
              <Link
                href="/features"
                className={`text-sm text-gray-300 hover:text-white ${
                  router.pathname === "/features" ? "text-white" : ""
                }`}
              >
                Features
              </Link>

              {isAuthenticated ? (
                <>
                  <Link
                    href="/dashboard"
                    className={`text-sm text-gray-300 hover:text-white ${
                      router.pathname === "/dashboard" ? "text-white" : ""
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/game"
                    className={`text-sm text-gray-300 hover:text-white ${
                      router.pathname === "/game" ? "text-white" : ""
                    }`}
                  >
                    Play Game
                  </Link>
                  <Link
                    href="/profile"
                    className={`text-sm text-gray-300 hover:text-white ${
                      router.pathname === "/profile" ? "text-white" : ""
                    }`}
                  >
                    Your Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-left text-red-400 hover:text-red-300"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className={`text-sm text-gray-300 hover:text-white ${
                      router.pathname === "/login" ? "text-white" : ""
                    }`}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 inline-block w-fit"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
