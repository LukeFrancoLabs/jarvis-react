import { useState, useEffect } from 'react';

export default function TasksPanel() {
    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('jarvis-tasks');
        return saved ? JSON.parse(saved) : [];
    });
    const [input, setInput] = useState('');

    useEffect(() => {
        localStorage.setItem('jarvis-tasks', JSON.stringify(tasks));
    }, [tasks]);

    const addTask = () => {
        if (input.trim()) {
            setTasks([...tasks, { id: Date.now(), text: input.trim(), completed: false }]);
            setInput('');
        }
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id) => {
        setTasks(tasks.filter(t => t.id !== id));
    };

    return (
        <div className="panel">
            <h2>Task Management</h2>
            <div className="task-input">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                    placeholder="Enter a task..."
                />
                <button onClick={addTask}>ADD TASK</button>
            </div>
            <div className="task-list">
                <ul>
                    {tasks.map(task => (
                        <li key={task.id} className={task.completed ? 'completed' : ''}>
                            <span onClick={() => toggleTask(task.id)}>{task.text}</span>
                            <button onClick={() => deleteTask(task.id)}>🗑️</button>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}