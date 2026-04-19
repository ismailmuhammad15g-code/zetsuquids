"use client";
import { ArrowRight, BadgeCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PricingTier {
  name: string;
  price: Record<string, number | string>;
  description: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  popular?: boolean;
}

interface PricingCardProps {
  tier: PricingTier;
  paymentFrequency: string;
  onSelect?: (tier: PricingTier) => void;
  isCurrentPlan?: boolean;
}

export function PricingCard({
  tier,
  paymentFrequency,
  onSelect,
  isCurrentPlan,
}: PricingCardProps) {
  const price = tier.price[paymentFrequency];
  const isHighlighted = tier.highlighted;
  const isPopular = tier.popular;

  function getButtonVariant() {
    if (isCurrentPlan) return "outline";
    return isHighlighted ? "secondary" : "default";
  }

  function getButtonText() {
    if (isCurrentPlan) return "Current Plan";
    return tier.cta;
  }

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-8 overflow-hidden p-6",
        isHighlighted
          ? "bg-foreground text-background"
          : "bg-background text-foreground",
        isPopular && "ring-2 ring-primary",
      )}
    >
      {isHighlighted && <HighlightedBackground />}
      {isPopular && <PopularBackground />}

      <h2 className="flex items-center gap-3 text-xl font-medium capitalize">
        {tier.name}
        {isPopular && (
          <Badge variant="secondary" className="mt-1 z-10">
            🔥 Most Popular
          </Badge>
        )}
      </h2>

      <div className="relative h-12">
        {typeof price === "number" ? (
          <>
            <span className="text-4xl font-medium">
              {price.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
            <p className="-mt-2 text-xs text-muted-foreground">
              Per month/user
            </p>
          </>
        ) : (
          <h1 className="text-4xl font-medium">{price}</h1>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <h3 className="text-sm font-medium">{tier.description}</h3>
        <ul className="space-y-2">
          {tier.features.map((feature, index) => (
            <li
              key={index}
              className={cn(
                "flex items-center gap-2 text-sm font-medium",
                isHighlighted ? "text-background" : "text-muted-foreground",
              )}
            >
              <BadgeCheck className="h-4 w-4" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <Button
        onClick={() => onSelect && onSelect(tier)}
        variant={getButtonVariant() as "outline" | "secondary" | "default"}
        disabled={isCurrentPlan}
        className={cn("w-full transition-all", isCurrentPlan && "opacity-80")}
      >
        {getButtonText()}
        {!isCurrentPlan && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>
    </Card>
  );
}

const HighlightedBackground: React.FC = () => <div />;
const PopularBackground: React.FC = () => <div />;
