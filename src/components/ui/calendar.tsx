import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  buttonVariant = "ghost",
  ...props
}: CalendarProps & { buttonVariant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: cn("flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0", classNames?.months),
        month: cn("space-y-4", classNames?.month),
        caption: cn("flex justify-center pt-1 relative items-center", classNames?.caption),
        dropdowns: cn(
          "inline-flex items-center justify-center rounded-md font-medium text-sm h-8 px-2.5 bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer",
          classNames?.dropdowns,
        ),
        dropdown_root: cn("relative inline-flex items-center", classNames?.dropdown_root),
        dropdown: cn("absolute inset-0 opacity-0 cursor-pointer", classNames?.dropdown),
        caption_label: cn("text-sm font-medium", classNames?.caption_label),
        table: cn("w-full border-collapse space-y-1", classNames?.table),
        head_row: cn("flex", classNames?.head_row),
        head_cell: cn(
          "text-muted-foreground rounded-md w-(--cell-size) font-normal text-[0.8rem] flex items-center justify-center",
          classNames?.head_cell,
        ),
        row: cn("flex w-full mt-2", classNames?.row),
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          classNames?.cell,
        ),
        day: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-(--cell-size) w-(--cell-size) p-0 font-normal aria-selected:opacity-100",
          classNames?.day,
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) => {
          if (orientation === "left") {
            return <ChevronLeftIcon className="h-4 w-4" />;
          }
          return <ChevronRightIcon className="h-4 w-4" />;
        },
        ...props.components,
      }}
      {...props}
    />
  );
}

Calendar.displayName = "Calendar";

export { Calendar };
