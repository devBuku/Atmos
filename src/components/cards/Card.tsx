import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type Props = {
  children: ReactNode;
  title: string;
  childrenClassName?: string;
  className?: string;
  headerAction?: ReactNode;
};

function Card({
  children,
  title,
  childrenClassName,
  className,
  headerAction,
}: Props) {
  return (
    <section
      aria-label={title}
      className={cn(
        "p-5 rounded-xl from-card to-card/60 bg-linear-to-br border border-border/60 shadow-md flex flex-col gap-4 text-foreground transition-all duration-200",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {headerAction}
      </div>
      <div className={childrenClassName}>{children}</div>
    </section>
  );
}

export default Card;
