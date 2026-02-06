import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import './components.css';

const ChatScreen = ({ messages, currentUser, onDecode }) => {
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentUser]);

    return (
        <div className="chat-screen">
            {messages.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                    <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>No messages yet.</p>
                    <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>Send a secure message to start.</p>
                </div>
            ) : (
                messages.map(msg => (
                    <MessageBubble
                        key={msg.id}
                        msg={msg}
                        currentUser={currentUser}
                        onDecode={onDecode}
                    />
                ))
            )}
            <div ref={bottomRef} />
        </div>
    );
};

export default ChatScreen;
