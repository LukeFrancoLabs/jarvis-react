export default function CronJobCard({ job, onExecute, onToggle, onDelete, formatDate }) {
    const nextRunDisplay = job.nextRun
        ? formatDate(job.nextRun)
        : job.enabled ? 'Calculating...' : 'Paused';

    return (
        <div className={`job-card ${!job.enabled ? 'disabled' : ''}`}>
            <div className="job-header">
                <div className="job-name">{job.name}</div>
                <div className={`schedule-badge ${!job.enabled ? 'paused' : ''}`}>
                    {job.scheduleHuman}
                </div>
            </div>

            <div className="job-status">
                <div className="status-indicator">
                    <span className={`status-dot ${job.enabled ? 'active' : 'paused'}`}></span>
                    <span className="status-text">{job.enabled ? 'Active' : 'Paused'}</span>
                </div>
            </div>

            <div className="job-details">
                <div className="detail-item">
                    <div className="detail-label">Cron Expression</div>
                    <div className="detail-value code">{job.schedule}</div>
                </div>
                <div className="detail-item">
                    <div className="detail-label">Command</div>
                    <div className="detail-value code">{job.command}</div>
                </div>
                <div className="detail-item">
                    <div className="detail-label">Directory</div>
                    <div className="detail-value">{job.directory}</div>
                </div>
                <div className="detail-item">
                    <div className="detail-label">Next Run</div>
                    <div className="detail-value next-run">{nextRunDisplay}</div>
                </div>
                <div className="detail-item">
                    <div className="detail-label">Last Run</div>
                    <div className="detail-value">{formatDate(job.lastRun)}</div>
                </div>
            </div>

            <div className="job-actions">
                <button
                    className="action-btn execute"
                    onClick={() => onExecute(job.id)}
                    disabled={!job.enabled}
                >
                    ▶ Run Now
                </button>
                <button
                    className={`action-btn toggle ${job.enabled ? 'pause' : 'resume'}`}
                    onClick={() => onToggle(job.id)}
                >
                    {job.enabled ? '⏸ Pause' : '▶ Resume'}
                </button>
                <button
                    className="action-btn delete"
                    onClick={() => onDelete(job.id)}
                >
                    🗑 Delete
                </button>
            </div>
        </div>
    );
}