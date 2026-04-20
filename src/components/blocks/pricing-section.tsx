
"use client";
import * as React from "react";
import { PricingCard } from "../ui/pricing-card";
import { Tab } from "../ui/pricing-tab";

type PaymentFrequency = "monthly" | "yearly";

interface PricingSectionTier {
  id: string;
  name: string;
  price: Record<PaymentFrequency, number | string>;
  description: string;
  features: string[];
  cta: string;
  popular?: boolean;
  highlighted?: boolean;
  credits?: number;
  planType?: "free" | "paid" | "custom";
}

interface PricingSectionProps {
  title: string;
  subtitle: string;
  tiers: PricingSectionTier[];
  frequencies: readonly PaymentFrequency[];
  user: { id?: string } | null;
  onPlanSelect: (tier: PricingSectionTier) => void;
  processingPayment: boolean;
}

export function PricingSection({
  title,
  subtitle,
  tiers,
  frequencies,
  user,
  onPlanSelect,
  processingPayment,
}: PricingSectionProps) {
  const [selectedFrequency, setSelectedFrequency] = React.useState(
    frequencies[0],
  );

  return (
    <section className="flex flex-col items-center gap-10 py-10" aria-busy={processingPayment}>
      <div className="space-y-7 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-medium md:text-5xl">{title}</h1>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <div className="mx-auto flex w-fit rounded-full bg-muted p-1">
          {frequencies.map((freq) => (
            <Tab
              key={freq}
              text={freq}
              selected={selectedFrequency === freq}
              setSelected={(text: string) => setSelectedFrequency(text as PaymentFrequency)}
              discount={freq === "yearly"}
            />
          ))}
        </div>
      </div>

      <div className="grid w-full max-w-6xl gap-6 sm:grid-cols-2 xl:grid-cols-4 px-4">
        {tiers.map((tier) => (
          <PricingCard
            key={tier.name}
            tier={tier}
            paymentFrequency={selectedFrequency}
            onSelect={(selectedTier) => onPlanSelect(selectedTier as PricingSectionTier)}
            isCurrentPlan={Boolean(user) && tier.id === "individuals"} // Assuming default plan is individuals/free
          />
        ))}
      </div>
    </section>
  );
}
export default PricingSection;
