import React, { useState, useRef } from 'react';
import { Send, Image as ImageIcon, Lock, X } from 'lucide-react';
import './components.css';

const MessageInput = ({ onSend, isSending }) => {
    const [text, setText] = useState('');
    const [secretFile, setSecretFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);

    const secretInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if ((!text && !secretFile)) return;

        // Send
        onSend({ text, secretFile, coverFile });

        // Clear state
        setText('');
        setSecretFile(null);
        setCoverFile(null);
        if (secretInputRef.current) secretInputRef.current.value = '';
        if (coverInputRef.current) coverInputRef.current.value = '';
    };

    const clearSecret = () => {
        setSecretFile(null);
        if (secretInputRef.current) secretInputRef.current.value = '';
    };

    const clearCover = () => {
        setCoverFile(null);
        if (coverInputRef.current) coverInputRef.current.value = '';
    };

    return (
        <form className="message-input-container glass" onSubmit={handleSubmit}>
            {/* Previews */}
            {(secretFile || coverFile) && (
                <div className="attachments-preview">
                    {secretFile && (
                        <div className="preview-chip" style={{ borderColor: 'var(--accent)' }}>
                            <Lock size={12} color="var(--accent)" />
                            <span>Secret: {secretFile.name}</span>
                            <button type="button" onClick={clearSecret}><X size={12} /></button>
                        </div>
                    )}
                    {coverFile && (
                        <div className="preview-chip" style={{ borderColor: 'var(--secondary)' }}>
                            <ImageIcon size={12} color="var(--secondary)" />
                            <span>Cover: {coverFile.name}</span>
                            <button type="button" onClick={clearCover}><X size={12} /></button>
                        </div>
                    )}
                </div>
            )}

            <div className="input-row">
                {/* Hidden inputs */}
                <input
                    type="file"
                    ref={secretInputRef}
                    onChange={(e) => setSecretFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    accept="image/*"
                />
                <input
                    type="file"
                    ref={coverInputRef}
                    onChange={(e) => setCoverFile(e.target.files[0])}
                    style={{ display: 'none' }}
                    accept="image/*"
                />

                <div className="text-input-wrapper">
                    <input
                        type="text"
                        className="text-input"
                        placeholder={secretFile ? "Using attached secret image..." : "Type a secret message..."}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={!!secretFile}
                    />
                </div>

                {/* Action Buttons */}
                <button
                    type="button"
                    className={`icon-btn ${secretFile ? 'active' : ''}`}
                    onClick={() => secretInputRef.current.click()}
                    title="Attach Secret Image (Optional)"
                >
                    <Lock size={20} />
                </button>

                <button
                    type="button"
                    className={`icon-btn ${coverFile ? 'active' : ''}`}
                    onClick={() => coverInputRef.current.click()}
                    title="Attach Cover Image (Optional)"
                >
                    <ImageIcon size={20} />
                </button>

                <button type="submit" className="send-btn" disabled={isSending || (!text && !secretFile)}>
                    {isSending ? '...' : <Send size={18} />}
                    <span>Send</span>
                </button>
            </div>
        </form>
    );
};

export default MessageInput;
