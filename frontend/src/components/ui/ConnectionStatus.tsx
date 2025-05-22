"use client";

import { useSocket } from "@/providers/socket-provider";
import { WifiOff, Wifi } from "lucide-react";
import { Button } from "./Button";

export const ConnectionStatus = () => {
  const { isConnected, reconnect } = useSocket();

  if (isConnected) {
    return (
      <div className="flex items-center text-xs gap-1 text-accent">
        <Wifi className="h-3 w-3" />
        <span className="hidden sm:inline">Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center text-xs gap-1 text-danger">
        <WifiOff className="h-3 w-3" />
        <span className="hidden sm:inline">Offline</span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-7 px-2 text-xs"
        onClick={reconnect}
      >
        Reconnect
      </Button>
    </div>
  );
};
