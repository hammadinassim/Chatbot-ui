import React from "react";
import {
  Container,
  Paper,
  TextField,
  IconButton,
  Box,
  Typography,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { styled } from "@mui/system";
import {
  IoSend,
  IoTrashBinOutline,
  IoThumbsUp,
  IoThumbsDown,
} from "react-icons/io5";
import { format } from "date-fns";
import bot_avatar from "../assets/chocked.jpeg";
import avatar from "../assets/avatar.jpg";

const ChatContainer = styled(Container)(({ theme }) => ({
  height: "95vh",
  minWidth: "95vw",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  padding: "25px",
  backgroundColor: "#f5f5f5",
  borderRadius: "10px",
  margin: theme.spacing(2),
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
}));

const MessageContainer = styled(Box)({
  flexGrow: 1,
  overflow: "auto",
  marginBottom: "16px",
  padding: "16px",
  // Hide scrollbar for Chrome, Safari and Opera
  "&::-webkit-scrollbar": {
    display: "none",
  },
  // Hide scrollbar for IE, Edge and Firefox
  "-ms-overflow-style": "none",
  "scrollbar-width": "none",
});

interface MessageBubbleProps {
  isUser: boolean;
}

const MessageBubble = styled(Paper)<MessageBubbleProps>(({ isUser }) => ({
  padding: "12px 16px",
  margin: "8px 0",
  maxWidth: "70%",
  borderRadius: "10px",
  backgroundColor: isUser ? "#1e233b" : "#ffffff",
  color: isUser ? "#ffffff" : "#000000",
  marginLeft: isUser ? "auto" : "0",
  marginRight: isUser ? "0" : "auto",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
  wordBreak: "break-word",
  whiteSpace: "pre-wrap",
  overflowWrap: "break-word",
}));

const InputContainer = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "16px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 -2px 4px rgba(0, 0, 0, 0.1)",
});

interface ChatMessage {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  feedback?: "up" | "down" | "";
  comment?: string;
}

const Chatbot = () => {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 1,
      text: "Hello! What can I do for help?",
      isUser: false,
      timestamp: new Date(),
      feedback: "",
    },
  ]);
  const [inputText, setInputText] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  /* --- Feedback management --- */
  const [showModal, setShowModal] = React.useState(false);
  const [feedbackComment, setFeedbackComment] = React.useState("");
  const [selectedMessageId, setSelectedMessageId] = React.useState<
    number | null
  >(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsThinking(true);

    // Mock bot response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: "Thank you for your message. I'm processing your request.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsThinking(false);
    }, 1000);
  };

  const handleClear = () => {
    setInputText("");
    setMessages([
      {
        id: 1,
        text: "Hello! What can I do for help?",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  /* --- Thumbs feedback management --- */

  // Green thumb
  const handleThumbUpClick = (messageId: number) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? // toggle
            { ...m, feedback: m.feedback === "up" ? "" : "up" }
          : m
      )
    );
  };

  // Red thumb : open popin to add feedback message
  const handleThumbDownClick = (messageId: number) => {
    setSelectedMessageId(messageId);
    setShowModal(true);

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: "down" } : m))
    );
  };

  // Close popin
  const handleCloseModal = () => {
    setShowModal(false);
    setFeedbackComment("");
    setSelectedMessageId(null);
  };

  // Submit feedback
  const handleSubmitFeedback = () => {
    if (selectedMessageId) {
      // Stock comment in message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessageId ? { ...m, comment: feedbackComment } : m
        )
      );
      console.log(
        "Feedback for message",
        selectedMessageId,
        "with reason:",
        feedbackComment
      );
    }
    handleCloseModal();
  };

  return (
    <ChatContainer>
      <MessageContainer>
        {messages.map((message, idx) => (
          <Box
            key={message.id}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: message.isUser ? "flex-end" : "flex-start",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
              {!message.isUser && (
                <Avatar
                  src={bot_avatar}
                  alt="Bot Avatar"
                  sx={{ width: 48, height: 48 }}
                />
              )}
              <MessageBubble isUser={message.isUser}>
                <Typography variant="body1">{message.text}</Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, opacity: 0.7 }}
                  >
                    {format(message.timestamp, "HH:mm")}
                  </Typography>
                  {!message.isUser && idx !== 0 && (
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleThumbUpClick(message.id)}
                        aria-label="Thumbs up"
                        color={
                          message.feedback === "up" ? "success" : "default"
                        }
                      >
                        <IoThumbsUp />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => handleThumbDownClick(message.id)}
                        aria-label="Thumbs down"
                        color={
                          message.feedback === "down" ? "error" : "default"
                        }
                      >
                        <IoThumbsDown />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </MessageBubble>
              {message.isUser && (
                <Avatar
                  src={avatar}
                  alt="User Avatar"
                  sx={{ width: 48, height: 48 }}
                />
              )}
            </Box>
          </Box>
        ))}
        {isThinking && (
          <Typography variant="caption" sx={{ ml: 2, color: "text.secondary" }}>
            Bot is thinking...
          </Typography>
        )}
        <div ref={messagesEndRef} />
      </MessageContainer>
      <InputContainer>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          multiline
          maxRows={4}
          sx={{ backgroundColor: "#ffffff" }}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!inputText.trim()}
          sx={{
            backgroundColor: "#1976d2",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#1565c0",
            },
            height: 48,
            width: 48,
          }}
        >
          <IoSend />
        </IconButton>
        <IconButton
          color="error"
          onClick={handleClear}
          disabled={!messages?.find((message) => message.isUser)}
          sx={{
            backgroundColor: "#e00202",
            color: "#ffffff",
            "&:hover": {
              backgroundColor: "#a30202",
            },
            height: 48,
            width: 48,
          }}
        >
          <IoTrashBinOutline />
        </IconButton>
      </InputContainer>
      <Dialog open={showModal} onClose={handleCloseModal}>
        <DialogTitle>Can you give a feedback about my answer ?</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Tell me more..."
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleSubmitFeedback}>
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </ChatContainer>
  );
};

export default Chatbot;
