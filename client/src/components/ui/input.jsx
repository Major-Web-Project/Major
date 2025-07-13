import * as React from "react";

import { cn } from "../../lib/utils";


const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-mint-200 bg-mint-100 px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-indigo-700 placeholder:text-mint-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sky-400 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-input dark:bg-transparent dark:text-foreground dark:placeholder:text-muted-foreground dark:focus-visible:ring-ring",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };