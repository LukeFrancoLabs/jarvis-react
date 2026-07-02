import { useState, useCallback } from 'react';
import PricesBar from './components/PricesBar';
import Header from './components/Header';
import VoicePanel from './components/VoicePanel';
import ChatPanel from './components/ChatPanel';
import TasksPanel from './components/TasksPanel';
import ScriptsPanel from './components/ScriptsPanel';
import NewsPanel from './components/NewsPanel';
import CronPage from './components/CronPage';
import { useSpeech } from './hooks/useApi';
import './styles/App.css';

export default function App() {
    const [messages, setMessages] = useState([]);
    const { speak } = useSpeech();
    const [apiMessages, setApiMessages] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');

    const callAI = async (userMessage) => {
        const newApiMessages = [...apiMessages, { role: 'user', content: userMessage }];
        setApiMessages(newApiMessages);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [
                        { role: 'system', content: 'You are JARVIS, a sophisticated AI assistant inspired by Iron Man\'s AI. You are helpful, witty, and professional. Keep responses concise but helpful.' },
                        ...newApiMessages
                    ]
                })
            });

            const data = await response.json();
            const aiMessage = data.choices?.[0]?.message?.content || "I apologize, but I couldn't process that.";

            setApiMessages([...newApiMessages, { role: 'assistant', content: aiMessage }]);
            return aiMessage;
        } catch (error) {
            return "I encountered an error. Please try again.";
        }
    };

    const handleCommand = useCallback(async (command) => {
        setMessages(prev => [...prev, { sender: 'user', text: command }]);
        const response = await callAI(command);
        setMessages(prev => [...prev, { sender: 'jarvis', text: response }]);
        speak(response);
    }, [apiMessages, speak]);

    const handleScriptRun = async (prompt) => {
        setMessages(prev => [...prev, { sender: 'jarvis', text: 'Processing...' }]);
        const response = await callAI(prompt);
        setMessages(prev => [...prev.slice(0, -1), { sender: 'jarvis', text: response }]);
        speak(response);
    };

    return (
        <>
            <PricesBar />
            <div className="app">
                <Header />
                <nav className="tab-nav">
                    <button
                        className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        Dashboard
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'cron' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cron')}
                    >
                        Cron Jobs
                    </button>
                </nav>
                {activeTab === 'dashboard' ? (
                    <div className="dashboard">
                        <VoicePanel onCommand={handleCommand} />
                        <ChatPanel messages={messages} onSend={handleCommand} />
                        <TasksPanel />
                        <ScriptsPanel onRun={handleScriptRun} />
                        <NewsPanel />
                    </div>
                ) : (
                    <CronPage />
                )}
                <footer className="footer">
                    <p>JARVIS Command Center v2.0 (React) | Stark Industries © 2026</p>
                </footer>
            </div>
        </>
    );
}