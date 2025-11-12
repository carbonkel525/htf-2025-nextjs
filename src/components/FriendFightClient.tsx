"use client";

import { useState, useEffect } from "react";
import { Fish } from "@/types/fish";
import FishFightClient from "./FishFightClient";
import { User } from "lucide-react";
import Image from "next/image";

interface Friend {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
}

interface FriendFightClientProps {
  userFishes: Fish[];
  friends: Friend[];
}

export default function FriendFightClient({
  userFishes,
  friends,
}: FriendFightClientProps) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [friendFishes, setFriendFishes] = useState<Fish[]>([]);
  const [loadingFriendFishes, setLoadingFriendFishes] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch friend's fishdex when a friend is selected
  useEffect(() => {
    if (selectedFriend) {
      setLoadingFriendFishes(true);
      setError(null);
      fetch(`/api/friends/${selectedFriend.userId}/fishdex`)
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch friend's fishdex");
          }
          return res.json();
        })
        .then((data) => {
          setFriendFishes(data.fishes || []);
          setLoadingFriendFishes(false);
        })
        .catch((err) => {
          console.error("Error fetching friend's fishdex:", err);
          setError(err.message || "Failed to load friend's fish");
          setLoadingFriendFishes(false);
        });
    } else {
      setFriendFishes([]);
    }
  }, [selectedFriend]);

  // If no friends, show message
  if (friends.length === 0) {
    return (
      <div className="flex items-center justify-center bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] m-6 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-4">👥</div>
          <div className="text-xl font-bold text-text-primary mb-2 font-mono">
            NO FRIENDS YET
          </div>
          <div className="text-sm text-text-secondary font-mono">
            Add friends to battle against their fish!
          </div>
        </div>
      </div>
    );
  }

  // If friend is selected and fishes are loaded, show fight interface
  if (selectedFriend && !loadingFriendFishes && !error) {
    if (friendFishes.length === 0) {
      return (
        <div className="flex flex-col">
          <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] m-6 rounded-lg p-6">
            <button
              onClick={() => {
                setSelectedFriend(null);
                setFriendFishes([]);
              }}
              className="mb-4 text-sm text-text-secondary hover:text-sonar-green font-mono transition-colors"
            >
              ← Back to friend selection
            </button>
            <div className="text-center">
              <div className="text-4xl mb-4">🐟</div>
              <div className="text-xl font-bold text-text-primary mb-2 font-mono">
                {selectedFriend.name} HAS NO FISH
              </div>
              <div className="text-sm text-text-secondary font-mono">
                This friend hasn't caught any fish yet.
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Show fight interface with user's fish and friend's fish
    return (
      <div className="flex flex-col">
        <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] m-6 rounded-lg p-4">
          <button
            onClick={() => {
              setSelectedFriend(null);
              setFriendFishes([]);
            }}
            className="text-sm text-text-secondary hover:text-sonar-green font-mono transition-colors"
          >
            ← Back to friend selection
          </button>
        </div>
        <FishFightClient
          fishes={userFishes}
          opponentFishes={friendFishes}
          opponentName={selectedFriend.name}
        />
      </div>
    );
  }

  // Show friend selection UI
  return (
    <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-4 rounded-lg">
          <h2 className="text-xl font-bold text-sonar-green font-mono mb-2">
            SELECT OPPONENT
          </h2>
          <p className="text-xs text-text-secondary font-mono">
            Choose a friend to battle against
          </p>
        </div>

        {loadingFriendFishes ? (
          <div className="text-center py-8">
            <div className="text-text-secondary font-mono">
              Loading {selectedFriend?.name}'s fish...
            </div>
          </div>
        ) : error ? (
          <div className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] px-6 py-4 rounded-lg">
            <div className="text-danger-red font-mono">{error}</div>
            <button
              onClick={() => {
                setSelectedFriend(null);
                setError(null);
              }}
              className="mt-4 text-sm text-text-secondary hover:text-sonar-green font-mono transition-colors"
            >
              ← Back to friend selection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <button
                key={friend.id}
                onClick={() => setSelectedFriend(friend)}
                className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit-border] backdrop-blur-[10px] rounded-lg p-4 hover:border-sonar-green/50 transition-all text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  {friend.image ? (
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image
                        src={friend.image}
                        alt={friend.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-sonar-green/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-sonar-green" />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-bold text-text-primary font-mono">
                      {friend.name}
                    </div>
                    <div className="text-xs text-text-secondary font-mono">
                      {friend.email}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-sonar-green font-mono">
                  Click to battle →
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
