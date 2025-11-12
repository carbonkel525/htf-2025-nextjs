"use client";

import { useEffect, useState } from "react";
import ChallengeCard from "./ChallengeCard";
import { Challenge } from "@/services/challengeService";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function ChallengesClient() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/challenges");
      if (!response.ok) {
        throw new Error("Failed to fetch challenges");
      }
      const data = await response.json();
      setChallenges(data.challenges || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching challenges:", err);
      setError("Failed to load challenges");
    } finally {
      setLoading(false);
    }
  };

  const regenerateChallenges = async () => {
    try {
      setRegenerating(true);
      setError(null);
      const response = await fetch("/api/challenges", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to regenerate challenges");
      }
      const data = await response.json();
      setChallenges(data.challenges || []);
    } catch (err) {
      console.error("Error regenerating challenges:", err);
      setError("Failed to regenerate challenges");
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (challenges.length === 0 && !error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Daily Challenges</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchChallenges}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={regenerateChallenges}
              disabled={regenerating || loading}
            >
              {regenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  New Challenges
                </>
              )}
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Daily Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              No challenges available for today. Click "New Challenges" to generate some!
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Daily Challenges</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchChallenges}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={regenerateChallenges}
            disabled={regenerating || loading}
          >
            {regenerating ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                New Challenges
              </>
            )}
          </Button>
        </div>
      </div>
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">{error}</p>
          </CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => (
          <ChallengeCard key={challenge.id} challenge={challenge} />
        ))}
      </div>
    </div>
  );
}

