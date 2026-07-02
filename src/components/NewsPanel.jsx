import { useFetch } from '../hooks/useApi';

export default function NewsPanel() {
    const { data, loading } = useFetch('/api/news');

    const headlines = data?.headlines?.slice(0, 10) || [];

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    return (
        <div className="panel news-panel">
            <h2>📰 News Headlines</h2>
            {loading && !headlines.length ? (
                <div className="news-loading">Loading...</div>
            ) : (
                <div className="news-list">
                    {headlines.map((item, i) => (
                        <div key={i} className="news-item-row">
                            <span className="news-bullet">●</span>
                            <span className="news-text">{item.title}</span>
                            <span className="news-source-tag">{item.source}</span>
                        </div>
                    ))}
                </div>
            )}
            {data?.lastUpdate && (
                <div className="news-footer">
                    Updated {formatTime(data.lastUpdate)}
                </div>
            )}
        </div>
    );
}