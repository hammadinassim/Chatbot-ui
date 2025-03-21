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

/**
 * ChatMessage represents a single message in the chat.
 * - `localId`: a local unique ID for rendering in React.
 * - `conversationId`: the ID grouping messages in DynamoDB.
 * - `dbTimestamp`: ISO string (Sort Key in DynamoDB).
 * - `text`: the message text.
 * - `isUser`: true if user, false if bot.
 * - `feedback`: "up", "down", or "".
 * - `comment`: text for user feedback if "down".
 */
interface ChatMessage {
  localId: number;
  conversationId: string;
  dbTimestamp: string;
  text: string;
  isUser: boolean;
  feedback: "up" | "down" | "";
  comment: string;
}

// Replace with your API Gateway endpoint
const BACKEND_URL = "https://2lvum8mh59.execute-api.us-east-1.amazonaws.com";

/**
 * A default bot message that appears at the beginning of the chat.
 * We use a function to generate a fresh timestamp each time.
 */
const createDefaultBotMessage = (): ChatMessage => {
  return {
    localId: 1,
    conversationId: "conversation_1",
    dbTimestamp: new Date().toISOString(),
    text: "Hello! What can I do to help you?",
    isUser: false,
    feedback: "",
    comment: "",
  };
};

/**
 * Styled components for the layout.
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
  // Hide scrollbar for Chrome, Safari, Opera
  "&::-webkit-scrollbar": {
    display: "none",
  },
  // Hide scrollbar for IE, Edge, Firefox
  "-ms-overflow-style": "none",
  "scrollbar-width": "none",
});

/**
 * We'll use a Paper for the bubble. The prop `isUser` controls styles.
 */
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
   * Initialize `messages` with the default bot greeting.
   */
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    createDefaultBotMessage(),
  ]);

  /**
   * `inputText` is the user's current typed message.
   * `isThinking` can show a "Bot is thinking..." prompt.
   */
  const [inputText, setInputText] = React.useState("");
  const [isThinking, setIsThinking] = React.useState(false);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  /**
   * Modal for negative feedback:
   * - `showModal`: is dialog open/closed
   * - `feedbackComment`: user text for negative feedback
   * - `selectedLocalId`: which message is being commented on
   */
  const [showModal, setShowModal] = React.useState(false);
  const [feedbackComment, setFeedbackComment] = React.useState("");
  const [selectedLocalId, setSelectedLocalId] = React.useState<number | null>(
    null
  );

  /**
   * Fetch existing messages from DynamoDB once the component mounts.
   * Otherwise, we already have a local default.
   */
  React.useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/messages?conversationId=conversation_1`
        );
        const data = await response.json();
        // data is an array of items from DynamoDB
        const newMessages = data.map((item: any, index: number) => ({
          localId: index + 2, // offset so we don't clash with the first localId=1
          conversationId: item.conversationId,
          dbTimestamp: item.timestamp, // ISO string
          text: item.text,
          isUser: item.isUser,
          feedback: item.feedback || "",
          comment: item.comment || "",
        })) as ChatMessage[];

        setMessages((prev) => [...prev, ...newMessages]);
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };

    fetchMessages();
  }, []);

  /**
   * Scrolls the chat to the bottom whenever messages change.
   */
  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * Handle sending a user's new message.
   */
  const handleSend = async () => {
    if (!inputText.trim()) return;

    // Create a new localId for the message
    const newLocalId = Math.max(...messages.map((m) => m.localId)) + 1;
    // Create an ISO timestamp as the Sort Key
    const timestampIso = new Date().toISOString();

    const userMessage: ChatMessage = {
      localId: newLocalId,
      conversationId: "conversation_1",
      dbTimestamp: timestampIso,
      text: inputText,
      isUser: true,
      feedback: "",
      comment: "",
    };

    // Add to local state
    setMessages((prev) => [...prev, userMessage]);

    // Send to DynamoDB (POST)
    try {
      await fetch(`${BACKEND_URL}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: userMessage.conversationId,
          text: userMessage.text,
          isUser: userMessage.isUser,
          feedback: userMessage.feedback,
          comment: userMessage.comment,
        }),
      });
    } catch (error) {
      console.error("Send user message error:", error);
    }

    setInputText("");
    setIsThinking(true);

    // Simulate bot response
    setTimeout(async () => {
      const botLocalId = newLocalId + 1;
      const botTimestampIso = new Date().toISOString();
      const botMessage: ChatMessage = {
        localId: botLocalId,
        conversationId: "conversation_1",
        dbTimestamp: botTimestampIso,
        text: "Thank you for your message. I'm processing your request.",
        isUser: false,
        feedback: "",
        comment: "",
      };

      // Update local state
      setMessages((prev) => [...prev, botMessage]);

      // Also store in DynamoDB
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
   * Clear local messages and reset to the initial bot greeting.
   */
  const handleClear = () => {
    setInputText("");
    // Reset to just the default bot message again
    setMessages([createDefaultBotMessage()]);
  };

  /**
   * Send message on Enter.
   */
  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  /**
   * Thumbs-up toggles feedback between "" and "up".
   */
  const handleThumbUpClick = async (localId: number) => {
    const message = messages.find((m) => m.localId === localId);
    if (!message) return;

    const newFeedback = message.feedback === "up" ? "" : "up";

    // Update local state
    setMessages((prev) =>
      prev.map((m) =>
        m.localId === localId ? { ...m, feedback: newFeedback } : m
      )
    );

    // Update in DynamoDB (PUT)
    try {
      await fetch(`${BACKEND_URL}/messages`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: message.conversationId,
          timestamp: message.dbTimestamp,
          feedback: newFeedback,
          comment: message.comment,
        }),
      });
    } catch (error) {
      console.error("Update feedback error:", error);
    }
  };

  /**
   * Thumbs-down opens a modal for the user to provide a comment,
   * and locally sets feedback = "down" right away.
   */
  const handleThumbDownClick = (localId: number) => {
    setSelectedLocalId(localId);

    setMessages((prev) =>
      prev.map((m) => (m.localId === localId ? { ...m, feedback: "down" } : m))
    );

    setShowModal(true);
  };

  /**
   * Close the thumbs-down dialog without saving.
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setFeedbackComment("");
    setSelectedLocalId(null);
  };

  /**
   * When the user submits their feedback comment, update both local state
   * and DynamoDB with the reason for the thumbs-down.
   */
  const handleSubmitFeedback = async () => {
    if (selectedLocalId == null) {
      handleCloseModal();
      return;
    }

    // Update local state
    setMessages((prev) =>
      prev.map((m) =>
        m.localId === selectedLocalId ? { ...m, comment: feedbackComment } : m
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
            timestamp: message.dbTimestamp,
            feedback: "down",
            comment: feedbackComment,
          }),
        });
      } catch (error) {
        console.error("Update feedback error:", error);
      }
    }

    handleCloseModal();
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
              {/* Bot avatar on the left */}
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
                    {format(new Date(message.dbTimestamp), "HH:mm")}
                  </Typography>
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
              </MessageBubble>

              {/* User avatar on the right */}
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

      {/* Input field and send/clear buttons */}
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
          // Only enable if there's any user message
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

      {/* Dialog for negative feedback */}
      <Dialog open={showModal} onClose={handleCloseModal}>
        <DialogTitle>Could you give feedback about my answer?</DialogTitle>
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
