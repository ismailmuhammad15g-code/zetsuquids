import Lottie from "lottie-react";
import cakeAnimation from "../assets/cake_snipper.json";
import { useLoading } from "../contexts/LoadingContext";

export default function GlobalLoader() {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-64 h-64 md:w-80 md:h-80 relative">
        <Lottie
          animationData={cakeAnimation}
          loop={true}
          autoplay={true}
          className="w-full h-full drop-shadow-2xl"
        />
      </div>
      <p className="mt-4 text-gray-500 font-medium animate-pulse tracking-widest text-sm uppercase">
        Loading...
      </p>
    </div>
  );
}
