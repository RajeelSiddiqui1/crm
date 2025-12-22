// Input component extends from shadcnui
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useMotionTemplate, useMotionValue, motion } from "motion/react";

const Input = React.forwardRef(
  ({ className, type = "text", ...props }, ref) => {
    const radius = 100;
    const [visible, setVisible] = React.useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }) {
      const { left, top } = currentTarget.getBoundingClientRect();
      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }

    return (
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        style={{
          background: useMotionTemplate`
            radial-gradient(
              ${visible ? radius + "px" : "0px"} circle
              at ${mouseX}px ${mouseY}px,
              #3b82f6,
              transparent 80%
            )
          `,
        }}
        className="group/input rounded-lg p-[2px] transition duration-300"
      >
        <input
          ref={ref}
          type={type}
          className={cn(
            `
            flex h-10 w-full rounded-md
            border border-gray-300
            bg-white px-3 py-2

            text-sm text-black
            placeholder:text-gray-400

            shadow-sm
            transition duration-300

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-blue-500
            focus-visible:border-blue-500

            group-hover/input:shadow-none

            file:border-0 file:bg-transparent
            file:text-sm file:font-medium

            disabled:cursor-not-allowed
            disabled:opacity-50
            `,
            className
          )}
          {...props}
        />
      </motion.div>
    );
  }
);

Input.displayName = "Input";

export { Input };
