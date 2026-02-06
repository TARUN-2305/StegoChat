import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import './components.css';

const MessageBubble = ({ msg, currentUser, onDecode }) => {
    const isOwn = msg.sender === currentUser;
    const [showDecoded, setShowDecoded] = useState(true);

    // Trigger decode if it's a received message and we don't have the content yet
    useEffect(() => {
        if (!isOwn && !msg.decodedContent && !msg.isDecoding && !msg.error) {
            onDecode(msg.id, msg.stegoImage);
        }
    }, [isOwn, msg.decodedContent, msg.isDecoding, msg.error, msg.id, msg.stegoImage, onDecode]);

    return (
        <div className={`message-bubble ${isOwn ? 'sent' : 'received'}`}>
            <div className="stego-image-container glass">
                <img src={msg.stegoImage} alt="Stego Message" className="stego-image" />
            </div>

            {/* Metadata Row */}
            <div className="flex items-center justify-between mt-1 px-1">
                <span className="timestamp">
                    {isOwn ? 'You' : msg.sender} • {msg.timestamp}
                </span>

                {!isOwn && msg.decodedContent && (
                    <button
                        onClick={() => setShowDecoded(!showDecoded)}
                        className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                    >
                        {showDecoded ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showDecoded ? 'Hide Secret' : 'View Secret'}
                    </button>
                )}
            </div>

            {/* Metrics for Sender */}
            {isOwn && msg.metrics && (
                <div className="metrics-panel">
                    <span title="Peak Signal-to-Noise Ratio">PSNR: {msg.metrics.psnr} dB</span>
                    <span title="Structural Similarity Index">SSIM: {msg.metrics.ssim}</span>
                </div>
            )}

            {/* Decoded Content for Receiver */}
            {!isOwn && (showDecoded || !msg.decodedContent) && (
                <div className="decoded-panel glass">
                    <div className="decoded-label flex justify-between items-center">
                        <span>Hidden Message</span>
                        {msg.isDecoding && <span className="loader"></span>}
                    </div>

                    {msg.decodedContent ? (
                        <img src={msg.decodedContent} alt="Decoded Secret" className="decoded-content-img" />
                    ) : (
                        <div className="text-xs text-center p-4 text-white/50 min-h-[50px] flex items-center justify-center">
                            {msg.error ? (
                                <span className="text-red-400">Error: {msg.error}</span>
                            ) : (
                                <span>{msg.isDecoding ? 'Extracting deep steganography...' : 'Waiting...'}</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
