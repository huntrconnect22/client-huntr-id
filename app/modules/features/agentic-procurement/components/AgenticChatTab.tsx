import React from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Bot, Send } from "lucide-react";
import { useLanguage } from "../../../context/LanguageContext";
import { type ChatMessage } from "../types";

interface AgenticChatTabProps {
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (val: string) => void;
  isChatSending: boolean;
  onSendMessage: () => void;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function AgenticChatTab({
  chatMessages,
  chatInput,
  setChatInput,
  isChatSending,
  onSendMessage,
  chatEndRef,
}: AgenticChatTabProps) {
  const { t } = useLanguage();

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, sm: 2.5 },
        borderRadius: 3,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        height: 480,
      }}
    >
      {/* Header */}
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", pb: 1.5, borderBottom: 1, borderColor: "divider" }}>
        <Bot size={18} color="#ef7d00" />
        <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
          {t("agentic.chat.header")}
        </Typography>
      </Stack>

      {/* Message List */}
      <Box sx={{ flex: 1, overflowY: "auto", py: 2, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {chatMessages.map((msg, idx) => {
          const isAi = msg.role === "assistant";
          return (
            <Stack
              key={idx}
              direction="row"
              spacing={1}
              sx={{
                justifyContent: isAi ? "flex-start" : "flex-end",
                alignItems: "flex-start",
              }}
            >
              {isAi && (
                <Avatar
                  sx={{
                    width: 28,
                    height: 28,
                    bgcolor: (theme) => `${theme.palette.primary.main}1A`,
                    color: "primary.main",
                  }}
                >
                  <Bot size={15} />
                </Avatar>
              )}

              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  maxWidth: "80%",
                  bgcolor: isAi ? "action.hover" : "primary.main",
                  color: isAi ? "text.primary" : "#ffffff",
                  border: isAi ? 1 : 0,
                  borderColor: "divider",
                  whiteSpace: "pre-wrap",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {msg.content}
              </Box>
            </Stack>
          );
        })}
        <div ref={chatEndRef} />
      </Box>

      {/* Input Bar */}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          onSendMessage();
        }}
        sx={{ pt: 1.5, borderTop: 1, borderColor: "divider" }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <TextField
            fullWidth
            size="small"
            placeholder={t("agentic.chat.placeholder")}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            disabled={isChatSending}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isChatSending || !chatInput.trim()}
            endIcon={isChatSending ? <CircularProgress size={14} color="inherit" /> : <Send size={15} />}
            sx={{ borderRadius: 2, px: 2.5, textTransform: "none", fontWeight: 700, flexShrink: 0 }}
          >
            {t("agentic.chat.sendBtn")}
          </Button>
        </Stack>
      </Box>
    </Paper>
  );
}
