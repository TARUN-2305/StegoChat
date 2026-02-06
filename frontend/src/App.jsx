import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Info } from 'lucide-react';
import UserSelector from './components/UserSelector';
import ChatScreen from './components/ChatScreen';
import MessageInput from './components/MessageInput';
import './index.css';

// Configure Axios base URL
// Vite proxy handles /encode_message -> http://localhost:5000/encode_message
const API_BASE = '';

function App() {
  const [currentUser, setCurrentUser] = useState('Alice');
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  const handleSwitchUser = (user) => {
    setCurrentUser(user);
  };

  const handleSend = async ({ text, secretFile, coverFile }) => {
    setIsSending(true);
    const formData = new FormData();

    if (text) formData.append('secret_text', text);
    if (secretFile) formData.append('secret_image', secretFile);
    if (coverFile) formData.append('cover_image', coverFile);

    try {
      const response = await axios.post(`${API_BASE}/encode_message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { stego_image, metrics } = response.data;

      const newMessage = {
        id: Date.now(),
        sender: currentUser,
        receiver: currentUser === 'Alice' ? 'Bob' : 'Alice',
        stegoImage: stego_image,
        metrics: metrics,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        decodedContent: null,
        isDecoding: false,
        error: null
      };

      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error("Send error:", error);
      alert("Failed to send message: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSending(false);
    }
  };

  const handleDecode = async (msgId, stegoImage) => {
    // Mark as decoding
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDecoding: true } : m));

    try {
      // Send base64 string directly
      const response = await axios.post(`${API_BASE}/decode_message`, {
        stego_image: stegoImage
      });

      const { decoded_content } = response.data;

      setMessages(prev => prev.map(m => m.id === msgId ? {
        ...m,
        isDecoding: false,
        decodedContent: decoded_content
      } : m));
    } catch (error) {
      console.error("Decode error:", error);
      setMessages(prev => prev.map(m => m.id === msgId ? {
        ...m,
        isDecoding: false,
        error: "Failed to decode"
      } : m));
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header glass flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="logo-icon">
            <Shield size={24} color="white" />
          </div>
          <div>
            <h1>StegoChat</h1>
            <div className="status-badge">
              <span className="status-indicator" />
              Secure Channel Active
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Info Pill */}
          <div className="info-pill hidden-mobile flex">
            <Info size={14} />
            Messages are hidden inside images
          </div>

          <UserSelector currentUser={currentUser} onSwitch={handleSwitchUser} />
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="main-area glass">
        <ChatScreen
          messages={messages}
          currentUser={currentUser}
          onDecode={handleDecode}
        />

        <MessageInput onSend={handleSend} isSending={isSending} />
      </main>

      {/* Footer Note */}
      <footer className="app-footer">
        StegoChat demonstrates a simulated two-user chat system built on deep learning image steganography,
        focusing on imperceptibility and recovery rather than user management.
      </footer>
    </div>
  );
}

export default App;
