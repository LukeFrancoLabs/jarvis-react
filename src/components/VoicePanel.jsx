import { useState, useCallback } from 'react';
import { useSpeech } from '../hooks/useApi';

export default function VoicePanel({ onCommand }) {
    const [isListening, setIsListening] = useState(false);
    const [lastCommand, setLastCommand] = useState('None');
    const { speak, speaking } = useSpeech();

    const handleVoice = useCallback(() => {
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
            speak("Voice recognition not supported");
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setLastCommand(`"${transcript}"`);
            onCommand(transcript);
        };

        recognition.onerror = () => {
            setIsListening(false);
            speak("I couldn't process that. Please try again.");
        };

        recognition.start();
    }, [onCommand, speak]);

    return (
        <div className="panel voice-panel">
            <h2>Voice Command Interface</h2>
            <button
                className={`pulse-button ${isListening ? 'active' : ''}`}
                onClick={handleVoice}
                disabled={speaking}
            >
                <svg className="robot-icon" viewBox="0 0 100 100">
                    <defs>
                        <pattern id="binary" patternUnits="userSpaceOnUse" width="10" height="10">
                            <text x="0" y="8" fontSize="6" fill="currentColor" opacity="0.7">01</text>
                        </pattern>
                    </defs>
                    <rect x="20" y="10" width="60" height="50" rx="10" fill="url(#binary)" stroke="currentColor" strokeWidth="2"/>
                    <rect x="30" y="25" width="15" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <rect x="55" y="25" width="15" height="15" rx="3" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <rect x="5" y="60" width="25" height="30" rx="5" fill="url(#binary)" stroke="currentColor" strokeWidth="2"/>
                    <rect x="70" y="60" width="25" height="30" rx="5" fill="url(#binary)" stroke="currentColor" strokeWidth="2"/>
                    <rect x="40" y="55" width="20" height="10" fill="url(#binary)" stroke="currentColor" strokeWidth="1"/>
                </svg>
            </button>
            <div className="voice-output">
                <h3>Last Command:</h3>
                <p id="last-command">{lastCommand}</p>
            </div>
        </div>
    );
}