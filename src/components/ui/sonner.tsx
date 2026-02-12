'use client';

import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-stone-50 group-[.toaster]:text-stone-900 group-[.toaster]:border-stone-800 group-[.toaster]:shadow-lg group-[.toaster]:font-mono group-[.toaster]:uppercase group-[.toaster]:tracking-wider",
          description: "group-[.toast]:text-stone-700 group-[.toast]:font-mono group-[.toast]:uppercase group-[.toast]:tracking-wider",
          actionButton:
            "group-[.toast]:bg-stone-100 group-[.toast]:text-action-orange group-[.toast]:font-mono group-[.toast]:uppercase group-[.toast]:tracking-wider",
          cancelButton:
            "group-[.toast]:bg-stone-100 group-[.toast]:text-stone-700 group-[.toast]:font-mono group-[.toast]:uppercase group-[.toast]:tracking-wider",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
