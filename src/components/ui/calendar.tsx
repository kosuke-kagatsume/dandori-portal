"use client";

import * as React from "react";
import { DayPicker, DayPickerProps } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarProps = DayPickerProps & { className?: string };

function Calendar({
  className,
  classNames,
  showOutsideDays = false, // ★ outside daysを消す
  fixedWeeks = true,       // ★ 行高を安定させる（6週で固定）
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      fixedWeeks={fixedWeeks}
      // ★ 幅とセルサイズを固定して"にじみ"を防止
      className={cn(
        "p-3 select-none w-[20rem] min-w-[18rem] min-h-[18rem] [--cell-size:2.4rem]",
        className
      )}
      classNames={{
        months: "flex flex-col",
        month: "space-y-2",
        caption: "flex justify-center relative items-center",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-7 w-7 p-0 opacity-60 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",

        // ★ 7列グリッドを強制
        month_grid: "grid grid-cols-7 gap-y-1 w-full",
        weekdays: "grid grid-cols-7 text-xs",
        weekday: "text-muted-foreground font-normal text-center",
        week: "contents", // gridの行を崩さない

        day: cn(
          buttonVariants({ variant: "ghost" }),
          "mx-auto h-[var(--cell-size)] w-[var(--cell-size)] p-0 " +
            "text-sm font-normal aria-selected:bg-primary " +
            "aria-selected:text-primary-foreground"
        ),
        day_outside: "opacity-50",
        day_today: "bg-accent",
        day_disabled: "opacity-50 pointer-events-none",

        ...classNames, // 既存があればマージ
      }}
      components={{
        Chevron: ({ orientation }: { orientation: string }) => 
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          ),
      } as any}
      {...props}
    />
  );
}

export { Calendar }
