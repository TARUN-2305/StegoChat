import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Shield, Info, LogOut } from 'lucide-react';
import { io } from 'socket.io-client';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import MessageInput from './components/MessageInput';
import './index.css';

// Configure Axios base URL
const API_BASE = '';

// Socket connection
const socket = io(window.location.origin);

function App() {
  const [token, setToken] = useState(localStorage.getItem('stego_token'));
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('stego_user') || '');

  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (token) {
      fetchMessages();
      socket.on('new_message_alert', (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, { ...newMsg, decodedContent: null, isDecoding: false, error: null }];
        });
      });
    }

    return () => {
      socket.off('new_message_alert');
    };
  }, [token]);

  const handleLoginSuccess = (newToken, newUsername) => {
    setToken(newToken);
    setCurrentUser(newUsername);
    localStorage.setItem('stego_token', newToken);
    localStorage.setItem('stego_user', newUsername);
  };

  const handleLogout = () => {
    setToken(null);
    setCurrentUser('');
    localStorage.removeItem('stego_token');
    localStorage.removeItem('stego_user');
    setMessages([]);
  };

  const fetchMessages = async () => {
    try {
      const res = await axios.get(`${API_BASE}/messages`);
      setMessages(prev => {
        const newMsgs = res.data;
        return newMsgs.map(newM => {
          const existing = prev.find(p => p.id === newM.id);
          if (existing) {
            return { ...newM, decodedContent: existing.decodedContent, isDecoding: existing.isDecoding };
          }
          return { ...newM, isDecoding: false, decodedContent: null };
        });
      });
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const handleSend = async ({ text, secretFile, coverFile, password }) => {
    setIsSending(true);
    const formData = new FormData();

    if (text) formData.append('secret_text', text);
    if (secretFile) formData.append('secret_image', secretFile);
    if (coverFile) formData.append('cover_image', coverFile);
    if (password) formData.append('password', password);

    formData.append('sender', currentUser);
    formData.append('receiver', 'Global'); // Broadcast for now

    try {
      await axios.post(`${API_BASE}/encode_message`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) {
      console.error("Send error:", error);
      alert("Failed to send message: " + (error.response?.data?.error || error.message));
    } finally {
      setIsSending(false);
    }
  };

  const handleDecode = async (msgId, stegoImage) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDecoding: true } : m));

    try {
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

  if (!token) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-container">
      <header className="app-header glass flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="logo-icon">
            <Shield size={24} color="white" />
          </div>
          <div>
            <h1>StegoChat</h1>
            <div className="status-badge live">
              <span className="status-indicator" />
              Connected as {currentUser}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Logout Button */}
          <button onClick={handleLogout} className="text-gray-400 hover:text-white" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="main-area glass">
        <ChatScreen
          messages={messages}
          currentUser={currentUser}
          onDecode={handleDecode}
        />

        <MessageInput onSend={handleSend} isSending={isSending} />
      </main>

      <footer className="app-footer">
        StegoChat Mobile Ready • Logged in as {currentUser}
      </footer>
    </div>
  );
}

export default App;
