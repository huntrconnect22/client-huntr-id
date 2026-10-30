import { forwardRef, type ComponentPropsWithoutRef } from "react";
import Paper from "@mui/material/Paper";

export const Surface = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  function Surface({ style, ...props }, ref) {
    return <Paper {...props} ref={ref} variant="outlined" style={{ ...style, borderRadius: 8, boxShadow: "none", backgroundImage: "none" }} />;
  },
);
