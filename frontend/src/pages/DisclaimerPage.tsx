import { ShieldAlert, BookOpen, Scale, Eye } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Product Disclaimer & Guidelines</h1>
          <p>Important safety information and product positioning details for CardAdvisor</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--color-watch)' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <ShieldAlert size={36} color="var(--color-watch)" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '8px' }}>Not Financial Advice Notice</h3>
            <p style={{ color: 'var(--text-primary)', fontSize: '15px', marginBottom: '12px' }}>
              <strong>CardAdvisor is a tracking, comparison, and decision-support tool for collectibles.</strong> It does not provide financial advice and does not guarantee future profits. All evaluations, including "estimated fair ranges", "market signals", and "opportunity scores", are generated algorithmically based on public exports, active seller listings, and user inputs. These figures should only be used as general indicators.
            </p>
            <p style={{ color: 'var(--text-secondary)' }}>
              Collectible card markets are highly volatile. Card values can swing drastically based on game meta updates, card reprints, and tournament outcomes. Never spend money you cannot afford to lose on collectible assets.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <BookOpen size={20} color="var(--accent-primary)" />
            <h4 style={{ color: 'white', fontSize: '16px' }}>Verify Before Buying</h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Always verify card authenticity, condition, language, and the reliability of the seller before committing to a purchase. Look closely at back photos, holographic patterns, and text kerning, especially on high-value parallel arts.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
            <Scale size={20} color="var(--accent-primary)" />
            <h4 style={{ color: 'white', fontSize: '16px' }}>Fair Estimation Bounds</h4>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Estimated fair ranges are calculated using available API data feeds and manual entries. These figures may be outdated, incomplete, or affected by skew from outlier listings. Active asking prices on platforms are not a guaranteed indication of real transaction values.
          </p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '18px', color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Eye size={20} /> Essential Cautious Trading Practices
        </h3>
        <ul style={{ paddingLeft: '20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <li>
            <strong>Avoid Impulse Purchases:</strong> Use the watchlist and set target alerts rather than buying immediately during hype cycles.
          </li>
          <li>
            <strong>Evaluate Seller Fees:</strong> Standard comparison pages often omit platform transaction fees, payment processing fees, and localized customs shipping rates. Calculate your true total cost before comparing listings.
          </li>
          <li>
            <strong>Inspect Graded Cards carefully:</strong> Be sure to verify slab certification numbers directly on PSA, BGS, or CGC lookup engines to prevent purchasing cloned labels or counterfeit casings.
          </li>
        </ul>
      </div>
    </div>
  );
}
