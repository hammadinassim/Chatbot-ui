import React from "react";
import {
  Container,
  Paper,
  TextField,
  IconButton,
  Box,
  Typography,
  Avatar,
} from "@mui/material";
import { styled } from "@mui/system";
import { IoSend } from "react-icons/io5";
import { format } from "date-fns";

const ChatContainer = styled(Container)(({ theme }) => ({
  height: "90vh",
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(2),
  backgroundColor: "#f5f5f5",
  borderRadius: theme.spacing(2),
  margin: theme.spacing(2),
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
}));

const MessageContainer = styled(Box)({
  flexGrow: 1,
  overflow: "auto",
  marginBottom: "16px",
  padding: "16px",
});

interface MessageBubbleProps {
  isUser: boolean;
}

const MessageBubble = styled(Paper)<MessageBubbleProps>(({ isUser }) => ({
  padding: "12px 16px",
  margin: "8px 0",
  maxWidth: "70%",
  borderRadius: "12px",
  backgroundColor: isUser ? "#1976d2" : "#ffffff",
  color: isUser ? "#ffffff" : "#000000",
  alignSelf: isUser ? "flex-end" : "flex-start",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
}));

const InputContainer = styled(Box)({
  display: "flex",
  gap: "8px",
  padding: "16px",
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 -2px 4px rgba(0, 0, 0, 0.1)",
});

const Chatbot = () => {
  const [messages, setMessages] = React.useState([
    {
      id: 1,
      text: "Hello! How can I help you today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

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
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: messages.length + 2,
        text: "Thank you for your message. I'm processing your request.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <ChatContainer sx={{ minWidth: "1000px" }} maxWidth="md">
      <MessageContainer>
        {messages.map((message) => (
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
                  src="https://images.unsplash.com/photo-1531747118685-ca8fa6e08806"
                  alt="Bot Avatar"
                  sx={{ width: 32, height: 32 }}
                />
              )}
              <MessageBubble isUser={message.isUser}>
                <Typography variant="body1">{message.text}</Typography>
                <Typography
                  variant="caption"
                  sx={{ display: "block", mt: 0.5, opacity: 0.7 }}
                >
                  {format(message.timestamp, "HH:mm")}
                </Typography>
              </MessageBubble>
              {message.isUser && (
                <Avatar
                  src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde"
                  alt="User Avatar"
                  sx={{ width: 32, height: 32 }}
                />
              )}
            </Box>
          </Box>
        ))}
        {isTyping && (
          <Typography variant="caption" sx={{ ml: 2, color: "text.secondary" }}>
            Bot is typing...
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
          onKeyPress={handleKeyPress}
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
          }}
        >
          <IoSend />
        </IconButton>
      </InputContainer>
    </ChatContainer>
  );
};

export default Chatbot;
