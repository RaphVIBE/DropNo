import { cn } from "@/lib/utils";

/**
 * Mot-marque Drop No. — forme canonique unique, partagée par la nav, le login,
 * la page coming-soon, etc. La taille se règle via la classe du parent
 * (font-size hérité). translate="no" pour ne pas être auto-traduit.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      translate="no"
      className={cn("font-serif font-light italic tracking-tight", className)}
    >
      Drop <sup className="align-super text-[0.72em]">No.</sup>
    </span>
  );
}
