import { useState, useEffect, useCallback } from 'react';

export function useFetch(url, interval = null) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Fetch failed');
            const json = await response.json();
            setData(json);
            setError(null);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        fetchData();
        if (interval) {
            const id = setInterval(fetchData, interval);
            return () => clearInterval(id);
        }
    }, [fetchData, interval]);

    return { data, loading, error, refetch: fetchData };
}

export function useTime() {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(id);
    }, []);

    return time;
}

export function useVoiceRecognition(onResult) {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);

    let recognition = null;

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                onResult(transcript);
            };

            recognition.onend = () => setIsListening(false);
            recognition.onerror = (e) => {
                setError(e.error);
                setIsListening(false);
            };
        }
    }, [onResult]);

    const start = () => {
        if (recognition) {
            setIsListening(true);
            recognition.start();
        }
    };

    const stop = () => {
        if (recognition) {
            recognition.stop();
            setIsListening(false);
        }
    };

    return { isListening, error, start, stop };
}

export function useSpeech() {
    const [speaking, setSpeaking] = useState(false);

    const speak = (text) => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.onend = () => setSpeaking(false);
            setSpeaking(true);
            window.speechSynthesis.speak(utterance);
        }
    };

    return { speak, speaking };
}