import { useState } from 'react';

const PRESETS = [
    { name: 'Every minute', schedule: '* * * * *' },
    { name: 'Hourly', schedule: '0 * * * *' },
    { name: 'Daily at 8 AM', schedule: '0 8 * * *' },
    { name: 'Daily at 6 PM', schedule: '0 18 * * *' },
    { name: 'Weekly (Monday)', schedule: '0 9 * * 1' },
    { name: 'Monthly (1st)', schedule: '0 9 1 * *' }
];

export default function AddCronModal({ onClose, onAdd }) {
    const [name, setName] = useState('');
    const [schedule, setSchedule] = useState('0 8 * * *');
    const [command, setCommand] = useState('');
    const [directory, setDirectory] = useState('/Users/reddragon');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !schedule || !command) return;
        onAdd({ name, schedule, command, directory });
    };

    const handlePreset = (presetSchedule) => {
        setSchedule(presetSchedule);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Cron Job</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Job Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Daily Backup"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Cron Schedule</label>
                        <input
                            type="text"
                            value={schedule}
                            onChange={(e) => setSchedule(e.target.value)}
                            placeholder="* * * * *"
                            required
                        />
                        <div className="preset-buttons">
                            {PRESETS.map((preset) => (
                                <button
                                    key={preset.schedule}
                                    type="button"
                                    className={`preset-btn ${schedule === preset.schedule ? 'active' : ''}`}
                                    onClick={() => handlePreset(preset.schedule)}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Command</label>
                        <input
                            type="text"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            placeholder="e.g., python3 script.py"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Working Directory</label>
                        <input
                            type="text"
                            value={directory}
                            onChange={(e) => setDirectory(e.target.value)}
                            placeholder="/Users/reddragon"
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="submit-btn">
                            Add Job
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}