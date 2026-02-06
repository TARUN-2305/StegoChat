import React, { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import './components.css';

const UserSelector = ({ currentUser, onSwitch }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (user) => {
        onSwitch(user);
        setIsOpen(false);
    };

    return (
        <div className="user-selector-container">
            <button className="user-selector-btn glass" onClick={() => setIsOpen(!isOpen)}>
                <div className={`status-dot ${currentUser.toLowerCase()}`}></div>
                <span className="user-label">Login as: <strong>{currentUser}</strong></span>
                <ChevronDown size={16} />
            </button>

            {isOpen && (
                <div className="user-dropdown glass">
                    {['Alice', 'Bob'].map(user => (
                        <button
                            key={user}
                            className={`dropdown-item ${currentUser === user ? 'active' : ''}`}
                            onClick={() => handleSelect(user)}
                        >
                            <div className={`status-dot ${user.toLowerCase()}`}></div>
                            {user}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserSelector;
