import { cn } from "@/lib/utils";

const gradients = [
  "from-emerald-500 to-green-600",
  "from-teal-400 to-emerald-500",
  "from-green-400 to-teal-500",
  "from-lime-400 to-emerald-500",
  "from-cyan-400 to-teal-500",
  "from-emerald-400 to-cyan-500",
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
      <span className="text-white/90 font-serif text-3xl font-bold drop-shadow-sm select-none">
        {getInitials(title)}
      </span>
    </div>
  );
}
