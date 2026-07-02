import { useFetch, useTime } from '../hooks/useApi';

export default function Header() {
    const { data: weather } = useFetch('/api/weather', 30 * 60 * 1000);
    const time = useTime();

    const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    };

    const getYearLeft = () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear() + 1, 0, 1);
        const totalDays = (end - start) / 86400000;
        const daysPassed = (now - start) / 86400000;
        return ((totalDays - daysPassed) / totalDays * 100).toFixed(1);
    };

    const getNextHoliday = () => {
        const now = new Date();
        const year = now.getFullYear();
        const holidays = [
            { name: 'Memorial Day', date: new Date(year, 4, 26) },
            { name: 'Independence Day', date: new Date(year, 6, 4) },
            { name: 'Labor Day', date: new Date(year, 8, 1) },
            { name: 'Thanksgiving', date: new Date(year, 10, 28) },
            { name: 'Christmas', date: new Date(year, 11, 25) },
            { name: 'New Year', date: new Date(year + 1, 0, 1) }
        ];

        for (const h of holidays) {
            if (h.date > now) {
                const days = Math.ceil((h.date - now) / 86400000);
                return `${h.name} (${days}d)`;
            }
        }
        return 'New Year';
    };

    return (
        <header className="header">
            <div className="header-top">
                <div className="header-left">
                    <div className="stat-block">
                        <span className="stat-label">TEMP</span>
                        <span className="stat-value">{weather ? `${Math.round(weather.temp)}°F` : '--°F'}</span>
                    </div>
                </div>
                <h1>J.A.R.V.I.S.</h1>
                <div className="header-right">
                    <div className="stat-block">
                        <span className="stat-label">CONDITIONS</span>
                        <span className="stat-value" style={{ fontSize: '0.85em' }}>
                            {weather ? `${weather.conditions} • ${weather.humidity}% • ${weather.wind}` : 'Loading...'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="status-bar">
                <div className="status-item">
                    <span className="status-label">STATUS</span>
                    <span className="status-value online">ONLINE</span>
                </div>
                <div className="status-item">
                    <span className="stat-label">TIME</span>
                    <span className="status-value">{time.toLocaleTimeString()}</span>
                </div>
                <div className="status-item">
                    <span className="status-label">DATE</span>
                    <span className="status-value">{time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                </div>
                <div className="status-item">
                    <span className="status-label">WEEK</span>
                    <span className="status-value">W{getWeekNumber(time)}</span>
                </div>
                <div className="status-item">
                    <span className="status-label">YEAR LEFT</span>
                    <span className="status-value">{getYearLeft()}%</span>
                </div>
                <div className="status-item">
                    <span className="status-label">NEXT HOLIDAY</span>
                    <span className="status-value">{getNextHoliday()}</span>
                </div>
            </div>
        </header>
    );
}