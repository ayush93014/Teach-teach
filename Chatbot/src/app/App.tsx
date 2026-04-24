import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bot, MessageCircle, Send, Sparkles, User } from "lucide-react";

type Message = {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
};

type ChatApiResponse = {
  type: "technical_issue" | "attendance_issue" | "assignment_issue" | "concept_question" | "other";
  reply: string;
  escalate: boolean;
};

const suggestedQuestions: string[] = [
  "Explain this concept simply",
  "What are the key points?",
  "Can you give an example?",
  "How does this work?",
];

const CHAT_API_URL = "http://localhost:3001/api/chat";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "Hello! I'm here to help you understand concepts from your lectures. What would you like to learn about?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text ?? inputValue;
    if (!messageText.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText.trim() }),
      });

      if (!res.ok) {
        throw new Error("Server response was not ok");
      }

      const data = (await res.json()) as ChatApiResponse;
      const replyText =
        typeof data?.reply === "string" && data.reply.trim()
          ? data.reply.trim()
          : "Sorry — I couldn’t generate a response. Please try again.";

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: replyText,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "Chat server is not reachable. Start the backend with `npm run server` and try again.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.nativeEvent.isComposing || event.isComposing) {
      return;
    }

    if (event.key !== "Enter") {
      return;
    }

    if (event.shiftKey) {
      event.preventDefault();
      const { selectionStart, selectionEnd, value } = event.currentTarget;
      const nextValue = `${value.slice(0, selectionStart)}\n${value.slice(selectionEnd)}`;
      setInputValue(nextValue);

      window.requestAnimationFrame(() => {
        event.currentTarget.selectionStart = selectionStart + 1;
        event.currentTarget.selectionEnd = selectionStart + 1;
      });
      return;
    }

    if (!event.ctrlKey && !event.altKey && !event.metaKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="w-[380px] h-[550px] flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="relative flex items-center gap-3 px-4 py-4 overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600">
          <div
            className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]"
          />
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm animate-pulse">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="relative">
            <h3 className="text-white">AI Learning Assistant</h3>
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs text-white/90">Always here to help</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white px-4 py-4 space-y-4">
          {messages.length === 1 && (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSendMessage(question)}
                  className="inline-flex items-center gap-1 rounded-lg border border-purple-200 bg-white px-2 py-2 text-xs text-purple-700 transition-all duration-200 hover:bg-purple-50 hover:border-purple-300 hover:scale-105 active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  {question}
                </button>
              ))}
            </div>
          )}

          {messages.map((message, index) => {
            const isUser = message.sender === "user";

            return (
              <div
                key={message.id}
                className={`flex gap-2 animate-[slideIn_0.3s_ease-out] ${isUser ? "flex-row-reverse" : "flex-row"}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center flex-shrink-0 rounded-full shadow-md ${
                    isUser
                      ? "bg-gradient-to-br from-pink-500 to-orange-500 text-white"
                      : "bg-gradient-to-br from-blue-500 to-purple-500 text-white"
                  }`}
                >
                  {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                    isUser
                      ? "rounded-tr-sm bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                      : "rounded-tl-sm border border-gray-200 bg-white text-gray-800"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  <span className={`mt-1 block text-xs ${isUser ? "text-white/80" : "text-gray-500"}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex gap-2 animate-[slideIn_0.3s_ease-out]">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-md">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0s" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.2s" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <footer className="border-t border-gray-200 bg-white px-4 py-4">
          <div className="flex items-end gap-2">
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              className="min-h-[42px] max-h-[80px] w-full resize-none rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white hover:bg-white hover:shadow-md hover:ring-2 hover:ring-purple-300 transition-all duration-300 ease-in-out"
              rows={1}
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-white transition-all duration-200 hover:shadow-lg hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </footer>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
