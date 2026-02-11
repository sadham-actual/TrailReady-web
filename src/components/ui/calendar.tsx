import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium font-mono uppercase tracking-wider",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-stone-50 p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-stone-700 rounded-sm w-9 font-normal text-[0.8rem] font-mono uppercase tracking-wider",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-sm [&:has([aria-selected].day-outside)]:bg-stone-100 [&:has([aria-selected])]:bg-stone-100 first:[&:has([aria-selected])]:rounded-l-sm last:[&:has([aria-selected])]:rounded-r-sm focus-within:relative focus-within:z-20",
        day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_range_end: "day-range-end",
        day_selected:
          "bg-stone-100 text-action-orange hover:bg-stone-100 hover:text-action-orange focus:bg-stone-100 focus:text-action-orange",
        day_today: "bg-stone-100 text-action-orange",
        day_outside:
          "day-outside text-stone-700 opacity-50 aria-selected:bg-stone-100 aria-selected:text-stone-700 aria-selected:opacity-30",
        day_disabled: "text-stone-700 opacity-50",
        day_range_middle: "aria-selected:bg-stone-100 aria-selected:text-action-orange",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...props }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" {...props} />
        },
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
