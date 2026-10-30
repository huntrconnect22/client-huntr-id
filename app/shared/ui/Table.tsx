import { forwardRef, type ComponentPropsWithoutRef } from "react";
import MuiTableCell from "@mui/material/TableCell";

export { default as Table } from "@mui/material/Table";
export { default as TableHead } from "@mui/material/TableHead";
export { default as TableBody } from "@mui/material/TableBody";
export { default as TableRow } from "@mui/material/TableRow";

export const TableCell = forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<"td">>(
  function TableCell({ align, ...props }, ref) { return <MuiTableCell {...props} align={align === "char" ? undefined : align} ref={ref} component="td" />; },
);
export const TableHeaderCell = forwardRef<HTMLTableCellElement, ComponentPropsWithoutRef<"th">>(
  function TableHeaderCell({ align, ...props }, ref) { return <MuiTableCell {...props} align={align === "char" ? undefined : align} ref={ref} component="th" />; },
);
