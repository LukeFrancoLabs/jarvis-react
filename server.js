import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fetch from 'node-fetch';
import Parser from 'rss-parser';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import { homedir } from 'os';

const execAsync = promisify(exec);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const rssParser = new Parser();

app.use(express.json());

// RSS Feed URLs
const RSS_FEEDS = {
    bloomberg: 'https://news.google.com/rss/search?q=bloomberg+finance+markets&hl=en-US&gl=US&ceid=US:en',
    yahooFinance: 'https://news.google.com/rss/search?q=yahoo+finance+stock+market&hl=en-US&gl=US&ceid=US:en',
    markets: 'https://news.google.com/rss/search?q=stock+market+wall+street&hl=en-US&gl=US&ceid=US:en'
};

let newsCache = { headlines: [], lastUpdate: 0 };
const CACHE_DURATION = 5 * 60 * 1000;

async function fetchNewsHeadlines() {
    const now = Date.now();
    if (newsCache.headlines.length > 0 && (now - newsCache.lastUpdate) < CACHE_DURATION) {
        return newsCache.headlines;
    }

    const headlines = [];
    try {
        for (const [source, url] of Object.entries(RSS_FEEDS)) {
            try {
                const feed = await rssParser.parseURL(url);
                feed.items.slice(0, 10).forEach(item => {
                    headlines.push({
                        title: item.title,
                        link: item.link,
                        source: source,
                        pubDate: item.pubDate
                    });
                });
            } catch (e) {
                console.error(`Error fetching ${source}:`, e.message);
            }
        }
        headlines.sort(() => Math.random() - 0.5);
        newsCache = { headlines, lastUpdate: now };
    } catch (error) {
        console.error('Error fetching news:', error);
    }
    return headlines;
}

// API Routes
app.get('/api/news', async (req, res) => {
    try {
        const headlines = await fetchNewsHeadlines();
        res.json({ headlines, lastUpdate: newsCache.lastUpdate });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// Market prices
const FINNHUB_SYMBOLS = {
    'BTC': { symbol: 'BINANCE:BTCUSDT', type: 'crypto' },
    'ES_F': { symbol: 'ES', type: 'futures' },
    'NVDA': { symbol: 'NVDA', type: 'stock' },
    'VIX': { symbol: 'VIX', type: 'index' },
    'CL_F': { symbol: 'CL', type: 'futures' },
    'DXY': { symbol: 'DXY', type: 'index' }
};

let pricesCache = { data: null, lastUpdate: 0 };
const PRICES_CACHE_DURATION = 60 * 1000;

app.get('/api/prices', async (req, res) => {
    const now = Date.now();
    if (pricesCache.data && (now - pricesCache.lastUpdate) < PRICES_CACHE_DURATION) {
        return res.json(pricesCache.data);
    }

    const prices = {};
    const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

    try {
        for (const [displayName, config] of Object.entries(FINNHUB_SYMBOLS)) {
            try {
                const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${config.symbol}&token=${FINNHUB_KEY}`;
                const response = await fetch(quoteUrl);
                const data = await response.json();

                if (data.c !== undefined && data.c !== 0) {
                    prices[displayName] = {
                        price: data.c,
                        change: data.d ? data.d.toFixed(2) : '0.00',
                        changePercent: data.dp ? data.dp.toFixed(2) : '0.00',
                        previousClose: data.pc || data.c
                    };
                }
            } catch (e) {
                console.error(`Error fetching ${displayName}:`, e.message);
            }
        }

        if (Object.keys(prices).length < 6) {
            const yahooSymbols = {
                'BTC': 'BTC-USD',
                'ES_F': 'ES=F',
                'NVDA': 'NVDA',
                'VIX': '^VIX',
                'CL_F': 'CL=F',
                'DXY': 'DX-Y.NYB'
            };

            for (const [symbol, yahooSymbol] of Object.entries(yahooSymbols)) {
                if (!prices[symbol]) {
                    try {
                        const response = await fetch(
                            `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=2d`,
                            { headers: { 'User-Agent': 'Mozilla/5.0' } }
                        );
                        const data = await response.json();
                        const result = data.chart?.result?.[0];
                        if (result) {
                            const meta = result.meta;
                            const closes = result.indicators?.quote?.[0]?.close || [];
                            const currentPrice = closes[closes.length - 1] || meta.regularMarketPrice;
                            const previousClose = closes[closes.length - 2] || meta.previousClose;
                            const change = currentPrice - previousClose;
                            prices[symbol] = {
                                price: currentPrice,
                                change: change.toFixed(2),
                                changePercent: ((change / previousClose) * 100).toFixed(2),
                                previousClose: previousClose
                            };
                        }
                    } catch (e) {
                        console.error(`Yahoo fallback error for ${symbol}:`, e.message);
                    }
                }
            }
        }

        pricesCache = { data: prices, lastUpdate: now };
        res.json(prices);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch prices' });
    }
});

// Weather
let weatherCache = { data: null, lastUpdate: 0 };
const WEATHER_CACHE_DURATION = 30 * 60 * 1000;

app.get('/api/weather', async (req, res) => {
    const now = Date.now();
    if (weatherCache.data && (now - weatherCache.lastUpdate) < WEATHER_CACHE_DURATION) {
        return res.json(weatherCache.data);
    }

    try {
        const lat = 28.6681;
        const lon = -80.8397;
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph`
        );
        const data = await response.json();

        if (data.current) {
            const current = data.current;
            const weatherCodes = {
                0: 'Clear', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
                45: 'Foggy', 48: 'Rime fog', 51: 'Light drizzle', 53: 'Drizzle',
                55: 'Heavy drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
                71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 80: 'Light showers',
                81: 'Showers', 82: 'Heavy showers', 95: 'Thunderstorm'
            };
            const windDirections = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
            const windDir = windDirections[Math.round(current.wind_direction_10m / 45) % 8];

            const weather = {
                temp: current.temperature_2m,
                humidity: current.relative_humidity_2m,
                conditions: weatherCodes[current.weather_code] || 'Unknown',
                wind: `${current.wind_speed_10m}mph ${windDir}`
            };

            weatherCache = { data: weather, lastUpdate: now };
            res.json(weather);
        } else {
            throw new Error('No weather data');
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch weather' });
    }
});

// Chat API proxy
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model } = req.body;
        const response = await fetch(`${process.env.OLLAMA_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
            },
            body: JSON.stringify({
                model: model || process.env.MODEL || 'qwen3.5:cloud',
                messages: messages,
                stream: false
            })
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: 'API request failed' });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        model: process.env.MODEL || 'qwen3.5:cloud',
        connected: !!process.env.OLLAMA_API_KEY
    });
});

// ==================== Cron Management ====================

const CRON_METADATA_FILE = join(homedir(), '.jarvis_cron_jobs.json');

// Default cron jobs based on existing crontab
const DEFAULT_CRON_JOBS = [
    {
        id: 'market-briefing',
        name: 'Market Briefing',
        schedule: '30 7 * * *',
        command: 'python3 market_briefing.py',
        directory: '/Users/reddragon/macmini_automations/market_briefing',
        enabled: true,
        lastRun: null
    },
    {
        id: 'mlb-betting',
        name: 'MLB Betting Analysis',
        schedule: '0 15 * 4-9 *',
        command: 'mlb_betting_analysis.sh',
        directory: '/Users/reddragon/.hermes/projects/agents/mlb-betting-agent/scripts/',
        enabled: true,
        lastRun: null
    }
];

async function getCronMetadata() {
    try {
        const data = await fs.readFile(CRON_METADATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { jobs: DEFAULT_CRON_JOBS };
    }
}

async function saveCronMetadata(metadata) {
    await fs.writeFile(CRON_METADATA_FILE, JSON.stringify(metadata, null, 2));
}

async function getSystemCrontab() {
    try {
        const { stdout } = await execAsync('crontab -l 2>/dev/null');
        return stdout;
    } catch {
        return '';
    }
}

async function setSystemCrontab(content) {
    await execAsync(`echo "${content.replace(/"/g, '\\"')}" | crontab -`);
}

function parseCronEntry(line) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 6) return null;

    return {
        minute: parts[0],
        hour: parts[1],
        dayOfMonth: parts[2],
        month: parts[3],
        dayOfWeek: parts[4],
        command: parts.slice(5).join(' ')
    };
}

function calculateNextRun(schedule) {
    const now = new Date();
    const parts = schedule.split(' ');
    const minute = parseInt(parts[0]) || 0;
    const hour = parseInt(parts[1]) || 0;
    const dayOfMonth = parts[2];
    const month = parts[3];

    let next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setMinutes(minute);
    next.setHours(hour);

    // If time has passed today, start from tomorrow
    if (next <= now) {
        next.setDate(next.getDate() + 1);
    }

    // Handle month ranges (e.g., 4-9 for Apr-Sep)
    if (month !== '*') {
        const [startMonth, endMonth] = month.includes('-')
            ? month.split('-').map(Number)
            : [Number(month), Number(month)];

        const currentMonth = now.getMonth() + 1;

        if (currentMonth < startMonth) {
            next.setMonth(startMonth - 1);
            next.setDate(1);
            next.setHours(hour, minute, 0, 0);
        } else if (currentMonth > endMonth) {
            next.setFullYear(next.getFullYear() + 1);
            next.setMonth(startMonth - 1);
            next.setDate(1);
            next.setHours(hour, minute, 0, 0);
        }
    }

    return next;
}

function formatScheduleHuman(schedule) {
    const parts = schedule.split(' ');
    const minute = parts[0];
    const hour = parts[1];
    const dayOfMonth = parts[2];
    const month = parts[3];
    const dayOfWeek = parts[4];

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Handle daily
    if (minute !== '*' && hour !== '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `Daily at ${h12}:${minute.padStart(2, '0')} ${ampm}`;
    }

    // Handle month ranges
    if (month !== '*' && month.includes('-')) {
        const [start, end] = month.split('-').map(Number);
        const h = parseInt(hour);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 || 12;
        return `Daily at ${h12}:${minute.padStart(2, '0')} ${ampm} (${monthNames[start-1]} - ${monthNames[end-1]})`;
    }

    return schedule;
}

// GET /api/cron - List all cron jobs
app.get('/api/cron', async (req, res) => {
    try {
        const metadata = await getCronMetadata();
        const now = new Date();

        const jobs = metadata.jobs.map(job => ({
            ...job,
            nextRun: job.enabled ? calculateNextRun(job.schedule) : null,
            scheduleHuman: formatScheduleHuman(job.schedule)
        }));

        res.json({ jobs });
    } catch (error) {
        console.error('Error fetching cron jobs:', error);
        res.status(500).json({ error: 'Failed to fetch cron jobs' });
    }
});

// POST /api/cron - Add new cron job
app.post('/api/cron', async (req, res) => {
    try {
        const { name, schedule, command, directory } = req.body;

        if (!name || !schedule || !command) {
            return res.status(400).json({ error: 'Name, schedule, and command are required' });
        }

        const metadata = await getCronMetadata();

        const newJob = {
            id: `job-${Date.now()}`,
            name,
            schedule,
            command,
            directory: directory || homedir(),
            enabled: true,
            lastRun: null
        };

        metadata.jobs.push(newJob);
        await saveCronMetadata(metadata);

        // Add to system crontab
        const crontab = await getSystemCrontab();
        const newEntry = `${schedule} cd ${newJob.directory} && ${command} # jarvis:${newJob.id}\n`;
        await setSystemCrontab(crontab + newEntry);

        res.json({
            job: {
                ...newJob,
                nextRun: calculateNextRun(newJob.schedule),
                scheduleHuman: formatScheduleHuman(newJob.schedule)
            }
        });
    } catch (error) {
        console.error('Error adding cron job:', error);
        res.status(500).json({ error: 'Failed to add cron job' });
    }
});

// POST /api/cron/:id/execute - Execute job manually
app.post('/api/cron/:id/execute', async (req, res) => {
    try {
        const { id } = req.params;
        const metadata = await getCronMetadata();
        const job = metadata.jobs.find(j => j.id === id);

        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Execute the command
        const fullCommand = `cd ${job.directory} && ${job.command}`;
        execAsync(fullCommand).catch(e => console.error('Job execution error:', e));

        // Update last run time
        job.lastRun = new Date().toISOString();
        await saveCronMetadata(metadata);

        res.json({ success: true, message: `Executing: ${job.name}`, lastRun: job.lastRun });
    } catch (error) {
        console.error('Error executing job:', error);
        res.status(500).json({ error: 'Failed to execute job' });
    }
});

// PUT /api/cron/:id/toggle - Toggle job enabled/disabled
app.put('/api/cron/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const metadata = await getCronMetadata();
        const jobIndex = metadata.jobs.findIndex(j => j.id === id);

        if (jobIndex === -1) {
            return res.status(404).json({ error: 'Job not found' });
        }

        const job = metadata.jobs[jobIndex];
        job.enabled = !job.enabled;

        // Update crontab
        const crontab = await getSystemCrontab();
        const lines = crontab.split('\n');
        const jobLineIndex = lines.findIndex(l => l.includes(`# jarvis:${id}`));

        if (jobLineIndex !== -1) {
            if (job.enabled) {
                // Uncomment the line
                lines[jobLineIndex] = lines[jobLineIndex].replace(/^#/, '');
            } else {
                // Comment out the line
                lines[jobLineIndex] = '#' + lines[jobLineIndex];
            }
            await setSystemCrontab(lines.join('\n'));
        }

        await saveCronMetadata(metadata);

        res.json({
            job: {
                ...job,
                nextRun: job.enabled ? calculateNextRun(job.schedule) : null,
                scheduleHuman: formatScheduleHuman(job.schedule)
            }
        });
    } catch (error) {
        console.error('Error toggling job:', error);
        res.status(500).json({ error: 'Failed to toggle job' });
    }
});

// DELETE /api/cron/:id - Remove job
app.delete('/api/cron/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const metadata = await getCronMetadata();
        const jobIndex = metadata.jobs.findIndex(j => j.id === id);

        if (jobIndex === -1) {
            return res.status(404).json({ error: 'Job not found' });
        }

        // Remove from crontab
        const crontab = await getSystemCrontab();
        const lines = crontab.split('\n').filter(l => !l.includes(`# jarvis:${id}`));
        await setSystemCrontab(lines.join('\n'));

        // Remove from metadata
        metadata.jobs.splice(jobIndex, 1);
        await saveCronMetadata(metadata);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

app.listen(PORT, () => {
    console.log(`JARVIS API Server running on port ${PORT}`);
});