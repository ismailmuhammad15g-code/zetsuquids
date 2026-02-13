"use client";

import DotPattern from "@/components/ui/dot-pattern-1";

export function Quote() {
  return (
    <div className="w-full flex justify-center py-20 px-4">
      <div className="relative w-full max-w-5xl bg-white aspect-[16/9] md:aspect-[2/1] rounded-3xl overflow-hidden shadow-sm border border-neutral-100 flex items-center justify-center p-8 md:p-16">
        {/* Background Dots */}
        <DotPattern
          width={24}
          height={24}
          cx={2}
          cy={2}
          cr={2}
          className="fill-neutral-200"
        />

        {/* The Text Container with Yellow Box */}
        <div className="relative z-10 p-6 md:p-10 border-2 border-yellow-400">
          {/* Corner Handles (Squares) */}
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-yellow-400" />
          <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-yellow-400" />
          <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-yellow-400" />
          <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-yellow-400" />

          {/* "I believe" Label */}
          <p className="text-red-500 font-serif italic text-lg md:text-xl mb-4 md:mb-6">
            I believe
          </p>

          {/* Main Quote Text */}
          <div className="text-4xl md:text-5xl lg:text-7xl font-sans tracking-tight leading-[1.1] text-neutral-900">
            <div className="flex flex-wrap items-baseline gap-x-2 md:gap-x-4">
              <span className="font-bold">"Knowledge</span>
              <span className="font-light">grows</span>
              <span className="font-light">when</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-2 md:gap-x-4 mt-1 md:mt-2">
              <span className="font-light">it</span>
              <span className="font-light">is</span>
              <span className="font-bold">shared,</span>
              <span className="font-light">not</span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-2 md:gap-x-4 mt-1 md:mt-2">
              <span className="font-light">when</span>
              <span className="font-light">it</span>
              <span className="font-light">is</span>
              <span className="font-bold">hoarded..."</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quote;
