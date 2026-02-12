import SimpleMarquee from "@/components/fancy/blocks/simple-marquee";
import { cn } from "@/lib/utils";

const reviews = [
  {
    name: "Alex Rivera",
    username: "@arivera_dev",
    body: "ZetsuGuide revolutionized how I document my code. The AI assistance is spot on!",
    img: "https://avatar.vercel.sh/alex",
    role: "Senior Engineer",
  },
  {
    name: "Sarah Chen",
    username: "@sarahcodes",
    body: "Finally, a knowledge base that doesn't feel like a chore. The dark mode is beautiful.",
    img: "https://avatar.vercel.sh/sarah",
    role: "Frontend Lead",
  },
  {
    name: "Marcus Johnson",
    username: "@mj_tech",
    body: "The speed of searching through my guides is incredible. A must-have for developers.",
    img: "https://avatar.vercel.sh/marcus",
    role: "Full Stack Dev",
  },
  {
    name: "Emily Davis",
    username: "@emily_ai",
    body: "I love how easy it is to organize complex topics. The markdown support is top-notch.",
    img: "https://avatar.vercel.sh/emily",
    role: "Data Scientist",
  },
  {
    name: "David Kim",
    username: "@dkim_builds",
    body: "Sharing guides with my team has never been easier. Great work on the permissions system.",
    img: "https://avatar.vercel.sh/david",
    role: "Tech Lead",
  },
  {
    name: "Jessica Lee",
    username: "@jess_product",
    body: "The UI is so intuitive. I onboarded my entire team in less than 10 minutes.",
    img: "https://avatar.vercel.sh/jessica",
    role: "Product Manager",
  },
];

const firstRow = reviews.slice(0, reviews.length / 2);
const secondRow = reviews.slice(reviews.length / 2);

const ReviewCard = ({ img, name, username, body, role }) => {
  return (
    <figure
      className={cn(
        "relative h-full w-80 cursor-pointer overflow-hidden rounded-xl border p-6 mx-4",
        // light styles
        "border-gray-950/[.1] bg-white hover:bg-gray-50",
        // dark styles
        "dark:border-white/[.1] dark:bg-black/[.5] dark:hover:bg-white/[.05]",
      )}
    >
      <div className="flex flex-row items-center gap-3">
        <img
          className="rounded-full border border-gray-200"
          width="40"
          height="40"
          alt=""
          src={img}
        />
        <div className="flex flex-col">
          <figcaption className="text-sm font-bold text-gray-900 dark:text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {username}
          </p>
        </div>
      </div>
      <blockquote className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
        "{body}"
      </blockquote>
      <div className="mt-2 text-xs font-semibold text-indigo-500">{role}</div>
    </figure>
  );
};

export default function TestimonialsMarquee() {
  return (
    <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-white dark:bg-black py-20 border-t border-gray-200 dark:border-white/10">
      <div className="mb-12 text-center px-4">
        <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-800 to-neutral-500 dark:from-neutral-50 dark:to-neutral-400 mb-4">
          Community Love
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
          See what developers and teams are saying about ZetsuGuide.
        </p>
      </div>

      <SimpleMarquee baseVelocity={0.5} slowdownOnHover className="mb-4">
        {firstRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </SimpleMarquee>
      <SimpleMarquee baseVelocity={0.5} direction="right" slowdownOnHover>
        {secondRow.map((review) => (
          <ReviewCard key={review.username} {...review} />
        ))}
      </SimpleMarquee>

      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-white dark:from-black"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-white dark:from-black"></div>
    </div>
  );
}
