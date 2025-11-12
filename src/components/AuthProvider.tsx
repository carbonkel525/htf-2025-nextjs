"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { Coins } from "lucide-react";

export default function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function UserInfo() {
  const { data: session, isPending } = useSession();
  const [coins, setCoins] = useState<number | null>(null);
  const [loadingCoins, setLoadingCoins] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserCoins();
    }
  }, [session?.user?.id]);

  const fetchUserCoins = async () => {
    try {
      setLoadingCoins(true);
      const response = await fetch("/api/user");
      if (response.ok) {
        const data = await response.json();
        setCoins(data.user?.coins ?? 0);
      }
    } catch (error) {
      console.error("Error fetching user coins:", error);
    } finally {
      setLoadingCoins(false);
    }
  };

  if (isPending) {
    return <div className="text-text-secondary">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          redirect("/");
        },
      },
    });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="text-text-primary">
        <p className="font-medium">{session.user.name}</p>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>{session.user.email}</span>
          {loadingCoins ? (
            <span className="text-xs">...</span>
          ) : (
            <span className="flex items-center gap-1 text-yellow-400">
              <Coins className="h-3 w-3" />
              {coins ?? 0}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handleSignOut}
        className="px-4 py-2 bg-danger-red text-text-primary rounded-md hover:bg-danger-red/80 focus:outline-none focus:ring-2 focus:ring-danger-red transition"
      >
        Sign Out
      </button>
    </div>
  );
}
