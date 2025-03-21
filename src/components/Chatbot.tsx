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
  Rating,
} from "@mui/material";
import { styled } from "@mui/system";
import {
  IoSend,
  IoTrashBinOutline,
  IoThumbsUp,
  IoThumbsDown,
} from "react-icons/io5";
import { format } from "date-fns";
import { v4 as uuidv4 } from "uuid"; // For generating unique messageId
import bot_avatar from "../assets/chocked.jpeg";
import avatar from "../assets/avatar.jpg";

/**
 * Each message in the chat has:
 * - localId: unique number in React, for rendering only (not sent to backend).
 * - conversationId: PK in DynamoDB (ex: "conversation_1").
 * - messageId: SK in DynamoDB (a UUID).
 * - timestamp: ISO string for display/sorting.
 * - text: message text.
 * - isUser: true if user, false if bot.
 * - feedback: "up" | "down" | "".
 * - comment: optional text if feedback is negative (or for any feedback).
 * - rating: numeric rating (1–10) or null if none.
 */
interface ChatMessage {
  localId: number;
  conversationId: string;
  messageId: string;
  timestamp: string;
  text: string;
  isUser: boolean;
  feedback: "up" | "down" | "";
  comment: string;
  rating?: number | null;
}

/**
 * Your API Gateway endpoint. Update with the actual URL.
 */
const BACKEND_URL = "https://2lvum8mh59.execute-api.us-east-1.amazonaws.com";

/**
 * Default greeting from the bot.
 */
const createDefaultBotMessage = (): ChatMessage => ({
  localId: 1,
  conversationId: "conversation_1",
  messageId: uuidv4(),
  timestamp: new Date().toISOString(),
  text: "Hello! What can I do to help you?",
  isUser: false,
  feedback: "",
  comment: "",
  rating: null,
});

/**
 * Styles
 */
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
  "&::-webkit-scrollbar": {
    display: "none",
  },
  "-ms-overflow-style": "none",
  "scrollbar-width": "none",
});

const MessageBubble = styled(Paper)<{ isUser: boolean }>(({ isUser }) => ({
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

const Chatbot = () => {
  /**
   * Chat state initialization
   */
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    createDefaultBotMessage(),
  ]);
  const [inputText, setInputText] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);

  /**
   * For feedback dialog (shared for thumbs up & thumbs down)
   */
  const [showModal, setShowModal] = React.useState(false);
  const [feedbackComment, setFeedbackComment] = React.useState("");
  const [feedbackRating, setFeedbackRating] = React.useState<number | null>(5); // default rating
  const [selectedLocalId, setSelectedLocalId] = React.useState<number | null>(
    null
  );

  // We'll scroll to bottom when messages change
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  /**
   * Fetch conversation from DynamoDB on mount
   */
  React.useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/messages?conversationId=conversation_1`
        );
        const data = await response.json();

        // Convert each item to ChatMessage
        let newMessages = data.map((item: any, index: number) => {
          return {
            localId: index + 2,
            conversationId: item.conversationId,
            messageId: item.messageId,
            timestamp: item.timestamp,
            text: item.text,
            isUser: item.isUser,
            feedback: item.feedback || "",
            comment: item.comment || "",
            rating: item.rating ? Number(item.rating) : null,
          } as ChatMessage;
        });

        // Sort if you want chronological
        newMessages = newMessages.sort(
          (a: ChatMessage, b: ChatMessage) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );

        setMessages([createDefaultBotMessage()].concat(newMessages));
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchMessages();
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Single function to open the dialog for both thumbs up & thumbs down
   */
  const handleOpenFeedbackDialog = (
    localId: number,
    newFeedback: "up" | "down"
  ) => {
    setSelectedLocalId(localId);
    setShowModal(true);
    // maybe default rating is 10 for "up", 5 for "down"
    setFeedbackRating(newFeedback === "up" ? 10 : 1);
    setFeedbackComment("");

    // Set local feedback right away
    setMessages((prev) =>
      prev.map((m) =>
        m.localId === localId ? { ...m, feedback: newFeedback } : m
      )
    );
  };

  const handleThumbUpClick = (localId: number) => {
    handleOpenFeedbackDialog(localId, "up");
  };

  const handleThumbDownClick = (localId: number) => {
    handleOpenFeedbackDialog(localId, "down");
  };

  /**
   * Closes dialog without saving anything
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setFeedbackComment("");
    setFeedbackRating(5);
    setSelectedLocalId(null);
  };

  /**
   * When user clicks "Send" in the popin,
   * we store feedback, rating, comment in DB.
   */
  const handleSubmitFeedback = async () => {
    if (selectedLocalId == null) {
      handleCloseModal();
      return;
    }
    // Update local state
    setMessages((prev) =>
      prev.map((m) =>
        m.localId === selectedLocalId
          ? { ...m, comment: feedbackComment, rating: feedbackRating }
          : m
      )
    );

    // Update in DB
    const message = messages.find((m) => m.localId === selectedLocalId);
    if (message) {
      try {
        await fetch(`${BACKEND_URL}/messages`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: message.conversationId,
            messageId: message.messageId,
            feedback: message.feedback, // "up" or "down"
            comment: feedbackComment,
            rating: feedbackRating,
          }),
        });
      } catch (error) {
        console.error("Update feedback error:", error);
      }
    }
    handleCloseModal();
  };

  /**
   * Send a new user message, then simulate bot response
   */
  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newLocalId = messages.length
      ? Math.max(...messages.map((m) => m.localId)) + 1
      : 1;
    const newMessageId = uuidv4();
    const msgTimestamp = new Date().toISOString();

    const userMessage: ChatMessage = {
      localId: newLocalId,
      conversationId: "conversation_1",
      messageId: newMessageId,
      timestamp: msgTimestamp,
      text: inputText,
      isUser: true,
      feedback: "",
      comment: "",
      rating: null,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      await fetch(`${BACKEND_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userMessage),
      });
    } catch (error) {
      console.error("Send user message error:", error);
    }

    setInputText("");
    setIsThinking(true);

    // Simulate bot response
    setTimeout(async () => {
      const botLocalId = newLocalId + 1;
      const botMsgId = uuidv4();
      const botTimestamp = new Date().toISOString();

      const botMessage: ChatMessage = {
        localId: botLocalId,
        conversationId: "conversation_1",
        messageId: botMsgId,
        timestamp: botTimestamp,
        text: "Thank you for your message. I'm processing your request.",
        isUser: false,
        feedback: "",
        comment: "",
        rating: null,
      };

      setMessages((prev) => [...prev, botMessage]);

      try {
        await fetch(`${BACKEND_URL}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(botMessage),
        });
      } catch (error) {
        console.error("Send bot message error:", error);
      }
      setIsThinking(false);
    }, 1000);
  };

  /**
   * Clear local messages
   */
  const handleClear = () => {
    setInputText("");
    setMessages([createDefaultBotMessage()]);
  };

  /**
   * Handle Enter in text field
   */
  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <ChatContainer>
      <MessageContainer>
        {messages.map((message, idx) => (
          <Box
            key={message.localId}
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
                  {idx !== 0 ? (
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mt: 0.5, opacity: 0.7 }}
                    >
                      {format(new Date(message.timestamp), "HH:mm")}
                    </Typography>
                  ) : null}

                  {/* Show thumbs only for bot messages except the first greeting, if desired */}
                  {!message.isUser && idx !== 0 && (
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleThumbUpClick(message.localId)}
                        aria-label="Thumbs up"
                        color={
                          message.feedback === "up" ? "success" : "default"
                        }
                      >
                        <IoThumbsUp />
                      </IconButton>

                      <IconButton
                        size="small"
                        onClick={() => handleThumbDownClick(message.localId)}
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

                {/* Show rating if set */}
                {message.rating && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mt: 0.5,
                      fontStyle: "italic",
                    }}
                  >
                    Rating:{" "}
                    <Rating
                      value={message.rating}
                      readOnly
                      size="small"
                      max={10}
                    />
                  </Typography>
                )}
                {/* Show comment if set */}
                {message.comment && (
                  <Typography
                    variant="caption"
                    sx={{ display: "block", mt: 0.5, fontStyle: "italic" }}
                  >
                    Feedback: {message.comment}
                  </Typography>
                )}
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

      {/* Input field */}
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
          disabled={!messages.some((msg) => msg.isUser)}
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

      {/* Dialog for feedback, unchanged styling/layout from your code */}
      <Dialog open={showModal} onClose={handleCloseModal}>
        <DialogTitle>Can you give a feedback about my answer?</DialogTitle>
        <DialogContent>
          {/* Same layout as your original code */}
          <TextField
            fullWidth
            multiline
            rows={3}
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Tell me more..."
          />
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              flexDirection: "column",
              alignItems: "center",
              marginTop: 1,
            }}
          >
            <Typography component="legend">Rating</Typography>
            <Rating
              name="customized-10"
              value={feedbackRating || 0}
              max={10}
              onChange={(_, newVal) => {
                if (newVal) setFeedbackRating(newVal);
              }}
            />
          </Box>
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
