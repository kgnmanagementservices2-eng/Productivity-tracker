import { forwardRef } from "react";
import { cn } from "../../utils/cn";

const Button = forwardRef(({ 
  className, 
  variant = "primary", 
  size = "md", 
  type = "button", 
  children, 
  ...props 
}, ref) => {
  
  // Base styles applied to every button
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  // Dynamic variations
const variants = {
    // 🟢 Use the dynamic color, and a simple opacity trick for the hover state
    primary: "bg-[var(--tenant-primary,#0f172a)] text-white hover:opacity-90", 
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-700",
  };

  // Dynamic sizing
  const sizes = {
    sm: "h-9 px-3 text-sm",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8 text-lg",
  };

  return (
    <button
      ref={ref}
      type={type}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
export { Button };