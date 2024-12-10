import { useState, useRef, useEffect } from "react";
import {
  collection,
  getDocs,
  serverTimestamp,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import loadingImg from "../assets/loading.svg";
import "./ChatPage.css";

const ChatPage = ({ userid }) => {
  const [chatHistory, setChatHistory] = useState([
    { role: "assistant", content: "Hello! 👋 How can I assist you today?" },
  ]);
  const chatboxRef = useRef(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      const chatCollection = collection(db, "chats/" + userid + "/chats");
      const chatQuery = query(chatCollection, orderBy("timestamp", "desc"));
      try {
        const snapshot = await getDocs(chatQuery);
        const fetchedMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChatHistory([...chatHistory, ...fetchedMessages.reverse()]);
        scrollToBottom()
        setLoading(false);
      } catch (error) {
        console.error("Error fetching messages:", error);
        setLoading(false);
      }
    };
    fetchMessages();
  }, [userid]);

  const [userMessage, setUserMessage] = useState("");

  const API_KEY = import.meta.env.VITE_GPT_API_KEY;
  const API_URL = import.meta.env.VITE_GPT_API_URL;

  const simulateTyping = (message, callback) => {
    const words = message.split("");
    let currentText = "";

    words.forEach((char, index) => {
      setTimeout(() => {
        currentText += char;
        callback(currentText);
        chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
      }, index * 50);
    });
  };
  
  const scrollToBottom = ()=>{
    setTimeout(() => {
      chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
    }, 10);
  }

  const addMessageToServer = async (message, role) => {
    const chatCollection = collection(db, "chats/" + userid + "/chats");
    try {
      const newMessage = {
        content: message,
        role: role,
        timestamp: serverTimestamp(),
      };
      await addDoc(chatCollection, newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSend = async () => {
    if (!userMessage.trim()) return;
    scrollToBottom()
    addMessageToServer(userMessage, "user");
    const updatedChatHistory = [
      ...chatHistory,
      { role: "user", content: userMessage },
    ];
    setChatHistory(updatedChatHistory);
    setUserMessage("");

    setChatHistory((prev) => [
      ...prev,
      { role: "assistant", content: "Typing..." },
    ]);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4-turbo",
          messages: updatedChatHistory,
        }),
      });

      const data = await response.json();
      const botMessage = data.choices[0].message.content.trim();

      addMessageToServer(botMessage, "assistant");

      simulateTyping(botMessage, (text) => {
        setChatHistory((prev) => {
          const newHistory = [...prev];
          newHistory[newHistory.length - 1] = {
            role: "assistant",
            content: text,
          };
          return newHistory;
        });
      });
    } catch {
      setChatHistory((prev) => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = {
          role: "assistant",
          content: "Oops! Something went wrong. Please try again.",
        };
        return newHistory;
      });
    }
  };

  const handleInputChange = (e) => {
    setUserMessage(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chatbot-container">
      <div className="chatbox" ref={chatboxRef}>
        <ul>
          {loading ? (
            <img src={loadingImg} className="loading" />
          ) : (
            chatHistory.map((message, index) => (
              <li key={index} className={`chat ${message.role}`}>
                {message.role === "assistant" ? (
                  <span className="material-symbols-outlined avatar-assistant">
                    smart_toy
                  </span>
                ) : (
                  <span className="material-symbols-outlined avatar-user">
                    person
                  </span>
                )}
                <p>{message.content}</p>
              </li>
            ))
          )}
        </ul>
      </div>
      <div className="chat-input">
        <textarea
          value={userMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatPage;
