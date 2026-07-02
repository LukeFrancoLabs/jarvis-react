import { useFetch } from '../hooks/useApi';

const SYMBOLS = ['BTC', 'ES_F', 'NVDA', 'VIX', 'CL_F', 'DXY'];

const SYMBOL_LABELS = {
    BTC: '₿ BTC',
    ES_F: '📊 ES',
    NVDA: '🟢 NVDA',
    VIX: '📈 VIX',
    CL_F: '🛢️ CL',
    DXY: '💵 DXY'
};

export default function PricesBar() {
    const { data: prices } = useFetch('/api/prices', 60 * 1000);

    const formatPrice = (symbol, price) => {
        if (!price) return '--';
        if (symbol === 'BTC') return '$' + price.toLocaleString(undefined, { maximumFractionDigits: 0 });
        if (symbol === 'VIX' || symbol === 'DXY') return price.toFixed(2);
        return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    return (
        <div className="prices-bar">
            {SYMBOLS.map(symbol => {
                const info = prices?.[symbol];
                const changePercent = info ? parseFloat(info.changePercent) : 0;

                return (
                    <div key={symbol} className="price-item">
                        <span className="price-symbol">{SYMBOL_LABELS[symbol]}</span>
                        <span className="price-value">
                            {info ? formatPrice(symbol, info.price) : '--'}
                        </span>
                        <span className={`price-change ${changePercent >= 0 ? 'positive' : 'negative'}`}>
                            {info ? `${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%` : '--%'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}