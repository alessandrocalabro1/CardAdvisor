/**
 * Badge that shows the origin/quality of a data point,
 * so estimates are always transparent about their source.
 */
export function renderDataQualityBadge(dataQuality: string | undefined | null) {
  if (!dataQuality) return null;

  let label: string;
  let className: string;

  switch (dataQuality) {
    case 'REAL_PROVIDER':
      label = 'Provider reale';
      className = 'badge-transparency-real';
      break;
    case 'AGGREGATED_PROVIDER':
      label = 'Provider aggregato';
      className = 'badge-transparency-aggregated';
      break;
    case 'PUBLIC_EXPORT':
      label = 'Export pubblico';
      className = 'badge-transparency-export';
      break;
    case 'MANUAL':
      label = 'Manuale';
      className = 'badge-transparency-manual';
      break;
    case 'SEED_SAMPLE':
      label = 'Dato di esempio';
      className = 'badge-transparency-seed';
      break;
    case 'MOCK_TEST':
      label = 'Dato simulato';
      className = 'badge-transparency-mock';
      break;
    case 'NOT_CONFIGURED':
      label = 'Non configurato';
      className = 'badge-transparency-notconfigured';
      break;
    default:
      return null;
  }

  return (
    <span className={`badge ${className}`} style={{ fontSize: 10, padding: '1px 7px' }}>
      {label}
    </span>
  );
}
