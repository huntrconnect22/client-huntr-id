import React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { Sparkles, Zap, Sliders } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import { useAgenticPresets } from "../hooks/useAgenticPresets";

interface AgenticPromptInputProps {
  prompt: string;
  setPrompt: (val: string) => void;
  isRunning: boolean;
  onExecute: (presetPrompt?: string) => void;
}

export default function AgenticPromptInput({
  prompt,
  setPrompt,
  isRunning,
  onExecute,
}: AgenticPromptInputProps) {
  const { t } = useLanguage();
  const theme = useTheme();
  const presetPrompts = useAgenticPresets();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 3,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        gap: 2.5,
      }}
    >
      {/* Header */}
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2.5,
            bgcolor: "primary.main",
            color: "#ffffff",
            flexShrink: 0,
            boxShadow: (theme) => `0 4px 12px ${theme.palette.primary.main}35`,
          }}
        >
          <Sparkles size={20} />
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {t("agentic.prompt.header")}
            </Typography>
            <Chip
              size="small"
              label={t("agentic.prompt.badgeBeta")}
              color="warning"
              variant="outlined"
              sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={t("agentic.prompt.modelBadge")}
              color="primary"
              variant="outlined"
              sx={{ height: 20, fontSize: 10, fontWeight: 700 }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, lineHeight: 1.5 }}>
            {t("agentic.prompt.subtitle")}
          </Typography>
        </Box>
      </Stack>

      {/* Prompt Input & Execute Button */}
      <Box sx={{ position: "relative" }}>
        <TextField
          fullWidth
          multiline
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("agentic.prompt.placeholder")}
          disabled={isRunning}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              onExecute();
            }
          }}
          slotProps={{
            htmlInput: {
              sx: {
                fontSize: 14,
                lineHeight: 1.6,
                pr: { sm: 16 },
                pb: { xs: 6, sm: 0 },
              },
            },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 2.5,
            },
          }}
        />

        <Button
          variant="contained"
          color="primary"
          onClick={() => onExecute()}
          disabled={isRunning || !prompt.trim()}
          startIcon={
            isRunning ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Zap size={16} />
            )
          }
          sx={{
            position: { xs: "static", sm: "absolute" },
            right: 12,
            bottom: 12,
            mt: { xs: 1.5, sm: 0 },
            width: { xs: "100%", sm: "auto" },
            borderRadius: 2,
            px: 2.5,
            py: 1,
            fontWeight: 700,
            textTransform: "none",
            boxShadow: (theme) => `0 4px 14px ${theme.palette.primary.main}40`,
          }}
        >
          {isRunning ? t("agentic.prompt.processing") : t("agentic.prompt.execute")}
        </Button>
      </Box>

      {/* Preset Prompts Chips */}
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", overflowX: "auto", pb: 0.5 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "text.secondary", flexShrink: 0 }}>
          <Sliders size={13} />
          <Typography variant="caption" sx={{ fontWeight: 700 }}>
            {t("agentic.prompt.preset")}:
          </Typography>
        </Stack>

        {presetPrompts.map((item, idx) => (
          <Chip
            key={idx}
            clickable
            size="small"
            disabled={isRunning}
            label={item.title}
            onClick={() => {
              setPrompt(item.prompt);
              onExecute(item.prompt);
            }}
            variant="outlined"
            sx={{
              borderRadius: 1.5,
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
              "&:hover": {
                borderColor: "primary.main",
                color: "primary.main",
              },
            }}
          />
        ))}
      </Stack>
    </Paper>
  );
}
