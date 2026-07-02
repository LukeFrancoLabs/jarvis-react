import { useState } from 'react';

const SCRIPTS = [
    { id: 'market-briefing', icon: '📈', label: 'Market Briefing' },
    { id: 'sports-betting', icon: '🏈', label: 'Sports Betting' },
    { id: 'events-today', icon: '📅', label: 'Events Today' },
    { id: 'fishing-report', icon: '🎣', label: 'Fishing Report' }
];

const PROMPTS = {
    'market-briefing': 'Give me a concise market briefing. Cover: S&P 500 futures (ES), VIX, crude oil (CL), US Dollar (DXY), and Bitcoin. Mention key levels and any notable moves. Be brief but informative.',
    'sports-betting': 'Give me sports betting insights for today. Include key games, odds movements, and any notable line changes. Focus on NFL, NBA, MLB if in season. Be concise and informative.',
    'events-today': 'What are the major events happening today? Include economic data releases, earnings, Fed speakers, and any significant global events. Be brief.',
    'fishing-report': 'Give me a fishing report for Mims, Florida (Space Coast area). Include current weather conditions, tide times, best fishing spots, what\'s biting, and recommendations for today. Be practical and concise.'
};

export default function ScriptsPanel({ onRun }) {
    const [loading, setLoading] = useState(null);

    const handleClick = async (scriptId) => {
        setLoading(scriptId);
        await onRun(PROMPTS[scriptId]);
        setLoading(null);
    };

    return (
        <div className="panel">
            <h2>Scripts</h2>
            <div className="scripts-grid">
                {SCRIPTS.map(script => (
                    <button
                        key={script.id}
                        className={`script-btn ${loading === script.id ? 'loading' : ''}`}
                        onClick={() => handleClick(script.id)}
                        disabled={loading}
                    >
                        <span>{script.icon}</span>
                        {script.label}
                        {loading === script.id && ' ⏳'}
                    </button>
                ))}
            </div>
        </div>
    );
}