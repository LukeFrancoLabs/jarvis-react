import { useState, useEffect } from 'react';
import CronJobCard from './CronJobCard';
import AddCronModal from './AddCronModal';

export default function CronPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchJobs = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/cron');
            const data = await response.json();
            setJobs(data.jobs || []);
            setError(null);
        } catch (e) {
            setError('Failed to load cron jobs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
    }, []);

    const handleExecute = async (id) => {
        try {
            await fetch(`/api/cron/${id}/execute`, { method: 'POST' });
            fetchJobs();
        } catch (e) {
            console.error('Failed to execute job:', e);
        }
    };

    const handleToggle = async (id) => {
        try {
            await fetch(`/api/cron/${id}/toggle`, { method: 'PUT' });
            fetchJobs();
        } catch (e) {
            console.error('Failed to toggle job:', e);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        try {
            await fetch(`/api/cron/${id}`, { method: 'DELETE' });
            fetchJobs();
        } catch (e) {
            console.error('Failed to delete job:', e);
        }
    };

    const handleAddJob = async (job) => {
        try {
            await fetch('/api/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(job)
            });
            setShowModal(false);
            fetchJobs();
        } catch (e) {
            console.error('Failed to add job:', e);
        }
    };

    const stats = {
        total: jobs.length,
        active: jobs.filter(j => j.enabled).length,
        paused: jobs.filter(j => !j.enabled).length
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        const d = new Date(date);
        return d.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="cron-page">
            <div className="cron-header">
                <h1>Cron Jobs</h1>
                <button className="add-job-btn" onClick={() => setShowModal(true)}>
                    + Add Job
                </button>
            </div>

            <div className="cron-stats">
                <div className="stat-card">
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Jobs</div>
                </div>
                <div className="stat-card active">
                    <div className="stat-value">{stats.active}</div>
                    <div className="stat-label">Active</div>
                </div>
                <div className="stat-card paused">
                    <div className="stat-value">{stats.paused}</div>
                    <div className="stat-label">Paused</div>
                </div>
            </div>

            {loading ? (
                <div className="cron-loading">Loading cron jobs...</div>
            ) : error ? (
                <div className="cron-error">{error}</div>
            ) : jobs.length === 0 ? (
                <div className="cron-empty">No cron jobs configured. Click "Add Job" to create one.</div>
            ) : (
                <div className="cron-grid">
                    {jobs.map(job => (
                        <CronJobCard
                            key={job.id}
                            job={job}
                            onExecute={handleExecute}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            )}

            {showModal && (
                <AddCronModal
                    onClose={() => setShowModal(false)}
                    onAdd={handleAddJob}
                />
            )}
        </div>
    );
}