
import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, Bug, Zap } from 'lucide-react';
import axios from 'axios';
import './components.css';

const API_BASE = '';

const MessageBubble = ({ msg, currentUser, onDecode }) => {
    const isOwn = msg.sender === currentUser;
    const [showDecoded, setShowDecoded] = useState(true);
    const [showAttackMenu, setShowAttackMenu] = useState(false);
    const [attackedImage, setAttackedImage] = useState(null);
    const [attackType, setAttackType] = useState(null);
    const [isAttacking, setIsAttacking] = useState(false);
    const [attackedDecodedContent, setAttackedDecodedContent] = useState(null);
    const [isDecodingAttacked, setIsDecodingAttacked] = useState(false);

    // Trigger decode if it's a received message and we don't have the content yet
    useEffect(() => {
        if (!isOwn && !msg.decodedContent && !msg.isDecoding && !msg.error) {
            onDecode(msg.id, msg.stegoImage);
        }
    }, [isOwn, msg.decodedContent, msg.isDecoding, msg.error, msg.id, msg.stegoImage, onDecode]);

    const handleAttack = async (type) => {
        setIsAttacking(true);
        setShowAttackMenu(false);
        setAttackedDecodedContent(null); // Reset prev decode

        try {
            const res = await axios.post(`${API_BASE}/attack_image`, {
                stego_image: msg.stegoImage,
                attack_type: type
            });
            setAttackedImage(res.data.attacked_image);
            setAttackType(res.data.attack_type);
        } catch (err) {
            console.error("Attack failed", err);
            alert("Attack failed");
        } finally {
            setIsAttacking(false);
        }
    };

    const handleDecodeAttacked = async () => {
        if (!attackedImage) return;
        setIsDecodingAttacked(true);
        try {
            const res = await axios.post(`${API_BASE}/decode_message`, {
                stego_image: attackedImage
            });
            setAttackedDecodedContent(res.data.decoded_content);
        } catch (err) {
            console.error("Decode failed", err);
            setAttackedDecodedContent(null);
            alert("Failed to decode corrupted image!");
        } finally {
            setIsDecodingAttacked(false);
        }
    }

    return (
        <div className={`message-bubble ${isOwn ? 'sent' : 'received'}`}>
            <div className="stego-image-container glass">
                <img src={msg.stegoImage} alt="Stego Message" className="stego-image" />

                {/* Attack Button (Overlay) - Available for anyone to test robustness */}
                <button
                    className="attack-trigger-btn"
                    onClick={() => setShowAttackMenu(!showAttackMenu)}
                    title="Simulate Attack (Hacker Mode)"
                >
                    <Bug size={14} />
                </button>

                {showAttackMenu && (
                    <div className="attack-menu glass">
                        <div className="menu-header">Select Attack</div>
                        <button onClick={() => handleAttack('noise')}>Add Noise</button>
                        <button onClick={() => handleAttack('blur')}>Blur (Gaussian)</button>
                        <button onClick={() => handleAttack('jpeg')}>JPEG Compression</button>
                        <button onClick={() => handleAttack('crop')}>Crop Dropout</button>
                    </div>
                )}
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

            {/* ATTACKED SIMULATION RESULT */}
            {(isAttacking || attackedImage) && (
                <div className="attack-result-panel glass">
                    <div className="decoded-label flex justify-between items-center text-red-400">
                        <span>⚠️ Hacker View ({attackType})</span>
                        {isAttacking && <span className="loader"></span>}
                    </div>

                    {attackedImage && (
                        <>
                            <img src={attackedImage} className="stego-image simple-border" alt="Corrupted" />
                            <button
                                className="action-btn-small"
                                onClick={handleDecodeAttacked}
                                disabled={isDecodingAttacked}
                            >
                                <Zap size={12} />
                                {isDecodingAttacked ? 'Attempting Recovery...' : 'Attempt Decode'}
                            </button>

                            {/* Result of decoding the attacked image */}
                            {attackedDecodedContent && (
                                <div className="mt-2 border-t border-white/10 pt-2">
                                    <div className="decoded-label text-green-400">Recovered Secret:</div>
                                    <img src={attackedDecodedContent} className="decoded-content-img" alt="Recovered" />
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageBubble;
