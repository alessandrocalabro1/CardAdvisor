export function renderDataQualityBadge(dataQuality: string | undefined | null) {
  if (!dataQuality) return null;
  
  let label = 'Real Provider';
  let className = 'badge-transparency-real';

  switch (dataQuality) {
    case 'REAL_PROVIDER':
      label = 'Real Provider';
      className = 'badge-transparency-real';
      break;
    case 'AGGREGATED_PROVIDER':
      label = 'Aggregated Provider';
      className = 'badge-transparency-aggregated';
      break;
    case 'PUBLIC_EXPORT':
      label = 'Public Export';
      className = 'badge-transparency-export';
      break;
    case 'MANUAL':
      label = 'Manual';
      className = 'badge-transparency-manual';
      break;
    case 'SEED_SAMPLE':
      label = 'Seed Sample';
      className = 'badge-transparency-seed';
      break;
    case 'MOCK_TEST':
      label = 'Mock Test';
      className = 'badge-transparency-mock';
      break;
    case 'NOT_CONFIGURED':
      label = 'Unconfigured';
      className = 'badge-transparency-notconfigured';
      break;
    default:
      return null;
  }

  return (
    <span 
      className={`badge ${className}`} 
      style={{ 
        marginLeft: '6px', 
        fontSize: '10px', 
        padding: '2px 6px',
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle'
      }}
    >
      {label}
    </span>
  );
}
