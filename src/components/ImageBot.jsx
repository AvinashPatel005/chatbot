import { useState, useRef } from "react";
import "./ImageBot.css";

const ImageBot = () => {
  const [imageDescription, setImageDescription] = useState("");
  const [chatHistory, setChatHistory] = useState([{
    content: "Please describe an image. 😊",
    className: "incoming"
  }]);
  const imageboxRef = useRef(null);
  const IMAGE_API_KEY = import.meta.env.VITE_IMAGE_API_KEY;
  const IMAGE_API_URL = import.meta.env.VITE_IMAGE_API_URL;

  const createImageMessage = (content, className) => {
    return { content, className };
  };

  const scrollToBottom = () => {
    if (imageboxRef.current) {
      imageboxRef.current.scrollTop = imageboxRef.current.scrollHeight;
    }
  };

  const generateImage = async () => {
    if (!imageDescription.trim()) return;

    const refinedPrompt = `${imageDescription}, high-definition, ultra-realistic photo, photorealistic lighting, fine textures, depth of field, natural shadows, 4k resolution`;

    const outgoingMessage = createImageMessage(imageDescription, "outgoing");
    setChatHistory((prev) => [...prev, outgoingMessage]);

    const incomingMessage = createImageMessage("Generating image...", "incoming");
    setChatHistory((prev) => [...prev, incomingMessage]);

    try {
      const response = await fetch(IMAGE_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${IMAGE_API_KEY}`,
        },
        body: JSON.stringify({
          prompt: refinedPrompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        const imageUrl = data.data[0].url;
        setChatHistory((prev) => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1] = {
            content: <img src={imageUrl} alt="Generated" className="generated-image" />,
            className: "incoming",
          };
          return updatedHistory;
        });
      } else {
        setChatHistory((prev) => {
          const updatedHistory = [...prev];
          updatedHistory[updatedHistory.length - 1] = {
            content: "No image generated. Try adjusting the prompt for better results.",
            className: "incoming error",
          };
          return updatedHistory;
        });
      }
    } catch {
      setChatHistory((prev) => {
        const updatedHistory = [...prev];
        updatedHistory[updatedHistory.length - 1] = {
          content: "Failed to generate image. Check API key or try again later.",
          className: "incoming error",
        };
        return updatedHistory;
      });
    } finally {
      scrollToBottom();
    }
  };

  const handleInputChange = (e) => {
    setImageDescription(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      setImageDescription("")
      generateImage();
    }
  };

  return (
    <div className="imagebot-container">
      <div className="imagebox" ref={imageboxRef}>
        <ul>
          {chatHistory.map((message, index) => (
            <li key={index} className={`chat ${message.className}`}>
              {message.className === "incoming" ?(
                <span className="material-symbols-outlined avatar-assistant">image</span>
              ):
              <span className="material-symbols-outlined avatar-user">image</span>
              
              }
              <p>{message.content}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="image-input">
        <textarea
          value={imageDescription}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe the image you want..."
        />
        <button id="generate-btn" onClick={generateImage}>
          Generate
        </button>
      </div>
    </div>
  );
};

export default ImageBot;
