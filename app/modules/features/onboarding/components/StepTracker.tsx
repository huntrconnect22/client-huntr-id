import React from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import { CheckCircle2 } from "lucide-react";

interface StepTrackerProps {
  steps: {
    id: number;
    icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
    color: string;
    label: string;
  }[];
  currentSlide: number;
}

/**
 * StepTracker Component
 * 
 * Progress step indicator using pure Material UI.
 */
export const StepTracker: React.FC<StepTrackerProps> = ({ steps, currentSlide }) => {
  const theme = useTheme();

  return (
    <Box sx={{ mb: { xs: 3, md: 4.5 }, px: 1 }}>
      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        {steps.map((step, i) => {
          const isDone = currentSlide > step.id;
          const isActive = currentSlide === step.id;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              <Stack
                spacing={1}
                sx={{
                  alignItems: "center",
                  flex: 1,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <Box
                  sx={{
                    width: { xs: 40, md: 44 },
                    height: { xs: 40, md: 44 },
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.25s ease",
                    bgcolor: isDone
                      ? "#10b981"
                      : isActive
                      ? theme.palette.primary.main
                      : theme.palette.mode === "dark"
                      ? "rgba(255, 255, 255, 0.05)"
                      : "#f1f5f9",
                    color: isDone || isActive ? "#ffffff" : "text.disabled",
                    border: 1.5,
                    borderColor: isDone
                      ? "#10b981"
                      : isActive
                      ? theme.palette.primary.main
                      : "divider",
                    boxShadow: isActive
                      ? `0 4px 14px ${theme.palette.primary.main}40`
                      : isDone
                      ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                      : "none",
                  }}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <Icon size={18} />
                  )}
                </Box>

                {/* Step Label */}
                <Typography
                  variant="caption"
                  sx={{
                    display: { xs: isActive ? "block" : "none", md: "block" },
                    fontSize: { xs: 10, md: 11 },
                    fontWeight: isActive ? 700 : 500,
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    color: isDone
                      ? "#10b981"
                      : isActive
                      ? "text.primary"
                      : "text.secondary",
                  }}
                >
                  {step.label}
                </Typography>
              </Stack>

              {/* Connecting Line between steps */}
              {i < steps.length - 1 && (
                <Box
                  sx={{
                    flex: 1,
                    height: 2,
                    mt: { xs: -2.5, md: -3.5 },
                    mx: 1,
                    borderRadius: 1,
                    bgcolor: currentSlide > step.id ? "#10b981" : "divider",
                    transition: "background-color 0.3s ease",
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Stack>
    </Box>
  );
};
