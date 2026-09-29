import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function SeverityBadge({ severity }) {
  const norm = (severity || 'Medium').toLowerCase();

  const getIcon = () => {
    switch (norm) {
      case 'critical':
        return <AlertOctagon size={12} />;
      case 'high':
        return <AlertTriangle size={12} />;
      case 'medium':
        return <AlertCircle size={12} />;
      case 'low':
      default:
        return <Info size={12} />;
    }
  };

  return (
    <span className={`severity-badge ${norm}`}>
      {getIcon()}
      <span>{severity}</span>
    </span>
  );
}
