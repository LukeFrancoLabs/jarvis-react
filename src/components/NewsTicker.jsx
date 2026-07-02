import { useFetch } from '../hooks/useApi';

export default function NewsTicker() {
    const { data } = useFetch('/api/news', 5 * 60 * 1000);
    const headlines = data?.headlines || [];

    if (headlines.length === 0) {
        return (
            <div className="news-ticker-container">
                <div className="news-ticker-label">📰 LIVE FEED</div>
                <div className="news-ticker">
                    <div className="news-ticker-content">
                        <span className="news-item">Loading headlines...</span>
                    </div>
                </div>
            </div>
        );
    }

    const content = headlines.slice(0, 20).map((item, i) => (
        <span key={i} className="news-item">
            {item.title}
            <span className="news-source">{item.source}</span>
        </span>
    ));

    return (
        <div className="news-ticker-container">
            <div className="news-ticker-label">📰 LIVE FEED</div>
            <div className="news-ticker">
                <div className="news-ticker-content">
                    {content}{content}
                </div>
            </div>
        </div>
    );
}