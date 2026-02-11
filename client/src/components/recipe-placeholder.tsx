import { cn } from "@/lib/utils";

const gradients = [
  "from-emerald-400/80 to-teal-500/80",
  "from-teal-400/80 to-cyan-500/80",
  "from-green-400/80 to-emerald-500/80",
  "from-cyan-400/80 to-sky-500/80",
  "from-lime-400/80 to-green-500/80",
  "from-emerald-300/80 to-green-400/80",
];

function getGradient(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
}

function getInitials(title: string) {
  return title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

interface RecipePlaceholderProps {
  title: string;
  className?: string;
}

export default function RecipePlaceholder({ title, className }: RecipePlaceholderProps) {
  return (
    <div
      className={cn(
        "bg-gradient-to-br flex items-center justify-center",
        getGradient(title),
        className
      )}
    >
      <span className="text-white/80 font-serif text-3xl font-bold drop-shadow-sm select-none">
        {getInitials(title)}
      </span>
    </div>
  );
}
