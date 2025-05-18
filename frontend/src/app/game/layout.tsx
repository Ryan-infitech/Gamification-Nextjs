import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Play Game | CodeQuest Pixels",
  description: "Play CodeQuest Pixels and level up your coding skills!",
};

export default function GameLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
