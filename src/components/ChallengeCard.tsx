"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Coins } from "lucide-react";
import { Challenge } from "@/services/challengeService";

interface ChallengeCardProps {
  challenge: Challenge;
}

const COINS_REWARD = 100; // Coins awarded for completing a challenge

export default function ChallengeCard({ challenge }: ChallengeCardProps) {
  const progressValue = Math.min(
    ((challenge.currentProgress || 0) / challenge.target) * 100,
    100
  );
  const isCompleted = challenge.completed || false;

  return (
    <Card className={isCompleted ? "opacity-75" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{challenge.description}</CardTitle>
          {isCompleted && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Completed
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">
              {challenge.currentProgress || 0} / {challenge.target}
            </span>
          </div>
          <Progress value={progressValue} />
          <div className="flex items-center gap-1 text-sm text-muted-foreground pt-1">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span>Reward: {COINS_REWARD} coins</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

