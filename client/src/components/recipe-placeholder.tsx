import { cn } from "@/lib/utils";

const gradients = [
  "from-orange-400 to-rose-400",
  "from-emerald-400 to-teal-400",
  "from-violet-400 to-purple-400",
  "from-amber-400 to-orange-400",
  "from-sky-400 to-blue-400",
  "from-pink-400 to-fuchsia-400",
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
