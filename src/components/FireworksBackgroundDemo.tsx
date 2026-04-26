"use client";
import { FireworksBackground } from "@/components/animate-ui/components/backgrounds/fireworks";
import { useTheme } from "../contexts/ThemeContext";

type FireworksBackgroundDemoProps = {
  population: number;
};

export default function FireworksBackgroundDemo({
  population,
}: FireworksBackgroundDemoProps) {
  const { isDarkMode } = useTheme();

  return (
    <FireworksBackground
      className="absolute inset-0 flex items-center justify-center rounded-xl"
      color={isDarkMode ? "white" : "black"}
      population={population}
    />
  );
}
