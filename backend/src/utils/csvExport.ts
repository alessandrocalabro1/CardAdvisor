/**
 * Converts portfolio items to a CSV string.
 */
export function exportPortfolioToCsv(portfolioItems: any[]): string {
  const headers = [
    'Portfolio Item ID',
    'Card Name',
    'Set Name',
    'Card Number',
    'Rarity',
    'Purchase Price',
    'Shipping Cost',
    'Total Cost',
    'Purchase Date',
    'Marketplace',
    'Seller',
    'Estimated Current Value',
    'Theoretical Profit Loss',
    'ROI Percentage',
    'Notes'
  ];

  const rows = portfolioItems.map(item => {
    const card = item.card || {};
    return [
      item.id,
      card.name || '',
      card.setName || '',
      card.cardNumber || '',
      card.rarity || '',
      item.purchasePrice,
      item.shipping,
      item.totalCost,
      item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
      item.marketplace || '',
      item.seller || '',
      item.estimatedCurrentValue || 0,
      item.theoreticalProfitLoss || 0,
      item.roiPercentage || 0,
      item.notes || ''
    ];
  });

  const escapeField = (val: any) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeField).join(','))
  ].join('\r\n');

  return csvContent;
}
