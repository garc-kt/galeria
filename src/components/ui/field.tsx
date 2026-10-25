import { cn } from "@/lib/utils";

export const fieldClasses =
  "h-11 w-full border border-line bg-transparent px-3 text-sm text-fg outline-none transition-colors duration-150 placeholder:text-muted/60 focus:border-accent";

export const textareaClasses =
  "min-h-32 w-full border border-line bg-transparent px-3 py-2 text-sm text-fg outline-none transition-colors duration-150 placeholder:text-muted/60 focus:border-accent";

export const labelClasses = "mb-2 block text-xs text-muted";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn(labelClasses, className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClasses, className)} {...props} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(textareaClasses, className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClasses, "appearance-none pr-8", className)} {...props} />;
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-red-700">{children}</p>;
}
