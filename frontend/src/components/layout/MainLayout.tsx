"use client";

import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export default function MainLayout({
  children,
  showHeader = true,
  showFooter = true,
}: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
      {showHeader && <Header />}

      <main className="flex-grow py-8">
        <div className="container mx-auto px-4">{children}</div>
      </main>

      {showFooter && <Footer />}
    </div>
  );
}
