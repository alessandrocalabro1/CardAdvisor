import { ShieldAlert, BookOpen, Scale, Eye } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="page-wrap" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <div className="page-title-group">
          <h1>Disclaimer</h1>
          <p>Posizionamento del prodotto e linee guida per un uso consapevole</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16, borderColor: 'var(--warn-border)' }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <ShieldAlert size={26} color="var(--warn)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <h3 style={{ fontSize: 15.5, marginBottom: 8 }}>Non è consulenza finanziaria</h3>
            <p style={{ fontSize: 13.5, marginBottom: 10, lineHeight: 1.6 }}>
              <strong>CardAdvisor è uno strumento di tracciamento, confronto e supporto alle decisioni per collezionabili.</strong>{' '}
              Non fornisce consulenza finanziaria e non garantisce alcun rendimento. Le valutazioni — fasce eque stimate, segnali di mercato, punteggi di opportunità — sono calcolate algoritmicamente a partire da export pubblici, annunci attivi e inserimenti manuali, e vanno usate solo come indicatori generali.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
              Il mercato delle carte collezionabili è molto volatile: i valori possono variare drasticamente per cambi di meta, ristampe ed esiti dei tornei. Non spendere mai denaro che non puoi permetterti di perdere.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-cols-2" style={{ marginBottom: 16 }}>
        <div className="card">
          <div className="section-title">
            <BookOpen size={13} /> Verifica prima di acquistare
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.6 }}>
            Controlla sempre autenticità, condizione, lingua e affidabilità del venditore prima di ogni acquisto. Osserva foto del retro, pattern olografici e kerning del testo, soprattutto sulle alt-art di alto valore.
          </p>
        </div>

        <div className="card">
          <div className="section-title">
            <Scale size={13} /> Limiti delle stime
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 12.5, lineHeight: 1.6 }}>
            Le fasce eque stimate derivano da feed disponibili e inserimenti manuali: possono essere datate, incomplete o distorte da annunci anomali. I prezzi richiesti sugli annunci non indicano necessariamente valori reali di transazione.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="section-title">
          <Eye size={13} /> Pratiche di acquisto prudenti
        </div>
        <ul style={{ paddingLeft: 18, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5, lineHeight: 1.6 }}>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Evita gli acquisti d’impulso:</strong> usa la watchlist e gli avvisi di prezzo invece di comprare durante i cicli di hype.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Considera tutte le commissioni:</strong> molti confronti omettono commissioni di piattaforma, costi di pagamento e dogana. Calcola il costo totale reale prima di confrontare le offerte.
          </li>
          <li>
            <strong style={{ color: 'var(--text-primary)' }}>Controlla le carte gradate:</strong> verifica i numeri di certificazione degli slab direttamente su PSA, BGS o CGC per evitare etichette clonate o custodie contraffatte.
          </li>
        </ul>
      </div>
    </div>
  );
}
