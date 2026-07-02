import { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ messages, onSend }) {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (input.trim()) {
            onSend(input.trim());
            setInput('');
        }
    };

    return (
        <div className="panel">
            <h2>Chat Interface</h2>
            <div className="chat-container">
                <div className="chat-messages">
                    {messages.map((msg, i) => (
                        <div key={i} className={`message ${msg.sender}`}>
                            <div className="sender">{msg.sender === 'user' ? 'You' : 'JARVIS'}</div>
                            <div className="content">{msg.text}</div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <div className="chat-input-container">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message to JARVIS..."
                    />
                    <button onClick={handleSend}>SEND</button>
                </div>
            </div>
        </div>
    );
}