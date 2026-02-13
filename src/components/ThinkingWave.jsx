import { TextShimmerWave } from "@/components/ui/text-shimmer-wave";

export function ThinkingWave({ text = "Generating response...", className }) {
  return (
    <TextShimmerWave
      className={`[--base-color:#0D74CE] [--base-gradient-color:#5EB1EF] text-sm md:text-base font-medium ${className || ""}`}
      duration={1}
      spread={1}
      zDistance={1}
      scaleDistance={1.1}
      rotateYDistance={20}
    >
      {text}
    </TextShimmerWave>
  );
}
export default ThinkingWave;
