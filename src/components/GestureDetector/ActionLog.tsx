// Action log component

import type { LogEntry } from '../../utils/types';
import './ActionLog.css';

interface ActionLogProps {
    logs: LogEntry[];
}

export function ActionLog({ logs }: ActionLogProps) {
    return (
        <div className="action-log">
            {logs.length === 0 ? (
                <div className="log-item">Waiting for gestures...</div>
            ) : (
                logs.map((log) => (
                    <div key={log.id} className={`log-item ${log.type}`}>
                        {new Date(log.timestamp).toLocaleTimeString()}: {log.message}
                    </div>
                ))
            )}
        </div>
    );
}
