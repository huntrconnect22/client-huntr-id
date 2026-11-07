import React from "react";
import { Box, Typography, Stack, TextField } from "@mui/material";

/**
 * SlideSection Component
 * 
 * Container for each onboarding step with consistent MUI typography and icon badge.
 */
export const SlideSection = ({
  title,
  subtitle,
  icon,
  children,
  accentColor,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  accentColor?: string;
}) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          bgcolor: accentColor ? `${accentColor}15` : "primary.50",
          border: 1,
          borderColor: accentColor ? `${accentColor}35` : "primary.200",
          color: accentColor || "primary.main",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Stack>
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {children}
    </Box>
  </Box>
);

/**
 * Field Component
 * 
 * Standard MUI TextField wrapper with consistent styling.
 */
export const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  helperText,
}: {
  label: string;
  value: any;
  onChange: (val: any) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  helperText?: string;
}) => (
  <TextField
    fullWidth
    label={label}
    type={type}
    value={value ?? ""}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    required={required}
    helperText={helperText}
    variant="outlined"
    size="medium"
  />
);

/**
 * FormLabel Component
 * 
 * Uppercase tracking caption label.
 */
export const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <Typography
    variant="caption"
    sx={{
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.06em",
      color: "text.secondary",
      display: "block",
      mb: 0.75,
    }}
  >
    {children}
  </Typography>
);
