// Status badge component

import './StatusBadge.css';

interface StatusBadgeProps {
    message: string;
    active?: boolean;
}

export function StatusBadge({ message, active = false }: StatusBadgeProps) {
    return (
        <div className="status-overlay">
            <div className={`status-badge ${active ? 'active' : ''}`}>
                {message}
            </div>
        </div>
    );
}
