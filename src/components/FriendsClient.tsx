"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Copy, UserPlus, User, Check } from "lucide-react";
import { toast } from "sonner";

interface Friend {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  createdAt: Date;
}

export default function FriendsClient({ userId }: { userId: string }) {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState(false);
  const [friendIdInput, setFriendIdInput] = useState("");
  const [copied, setCopied] = useState(false);

  // Fetch friends list
  const fetchFriends = async () => {
    try {
      const response = await fetch("/api/friends");
      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      } else {
        toast.error("Failed to load friends");
      }
    } catch (error) {
      console.error("Error fetching friends:", error);
      toast.error("Error loading friends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  // Copy userId to clipboard
  const handleCopyUserId = async () => {
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      toast.success("User ID copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy user ID");
    }
  };

  // Add a new friend
  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendIdInput.trim()) {
      toast.error("Please enter a user ID");
      return;
    }

    setAddingFriend(true);
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ friendId: friendIdInput.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Friend added successfully!");
        setFriendIdInput("");
        fetchFriends(); // Refresh friends list
      } else {
        toast.error(data.error || "Failed to add friend");
      }
    } catch (error) {
      console.error("Error adding friend:", error);
      toast.error("Error adding friend");
    } finally {
      setAddingFriend(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Your User ID Section */}
        <Card className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-sonar-green" />
            <h2 className="text-xl font-bold text-sonar-green font-mono">
              YOUR USER ID
            </h2>
          </div>
          <p className="text-sm text-text-secondary mb-4 font-mono">
            Share this ID with your friends so they can add you:
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-deep-ocean border border-panel-border px-4 py-3 rounded font-mono text-text-primary break-all">
              {userId}
            </div>
            <Button
              onClick={handleCopyUserId}
              className="bg-sonar-green hover:bg-sonar-green/80 text-deep-ocean font-mono"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Add Friend Section */}
        <Card className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <UserPlus className="h-5 w-5 text-sonar-green" />
            <h2 className="text-xl font-bold text-sonar-green font-mono">
              ADD FRIEND
            </h2>
          </div>
          <p className="text-sm text-text-secondary mb-4 font-mono">
            Enter your friend's user ID to add them:
          </p>
          <form onSubmit={handleAddFriend} className="flex items-center gap-3">
            <Input
              type="text"
              value={friendIdInput}
              onChange={(e) => setFriendIdInput(e.target.value)}
              placeholder="Enter friend's user ID"
              className="flex-1 bg-deep-ocean border-panel-border text-text-primary font-mono"
              disabled={addingFriend}
            />
            <Button
              type="submit"
              disabled={addingFriend || !friendIdInput.trim()}
              className="bg-sonar-green hover:bg-sonar-green/80 text-deep-ocean font-mono"
            >
              {addingFriend ? "Adding..." : "Add Friend"}
            </Button>
          </form>
        </Card>

        {/* Friends List Section */}
        <Card className="bg-[color-mix(in_srgb,var(--color-dark-navy)_85%,transparent)] border-2 border-panel-border shadow-[--shadow-cockpit] backdrop-blur-[10px] p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="h-5 w-5 text-sonar-green" />
            <h2 className="text-xl font-bold text-sonar-green font-mono">
              YOUR FRIENDS ({friends.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-text-secondary font-mono text-center py-8">
              Loading friends...
            </div>
          ) : friends.length === 0 ? (
            <div className="text-text-secondary font-mono text-center py-8">
              No friends yet. Add a friend using their user ID above!
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="bg-deep-ocean border border-panel-border px-4 py-3 rounded flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {friend.image ? (
                      <img
                        src={friend.image}
                        alt={friend.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-sonar-green/20 flex items-center justify-center">
                        <User className="h-5 w-5 text-sonar-green" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-text-primary">
                        {friend.name}
                      </div>
                      <div className="text-sm text-text-secondary font-mono">
                        {friend.email}
                      </div>
                      <div className="text-xs text-text-secondary font-mono mt-1">
                        ID: {friend.userId}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

