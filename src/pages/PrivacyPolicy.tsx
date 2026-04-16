import { Link } from 'react-router-dom';
import { Globe, ArrowLeft } from 'lucide-react';

const OWNER = 'Gherardo Siliprandi';
const EMAIL = 'privacy@newsbynation.web.app'; // ← sostituisci con la tua email reale
const SITE_URL = 'https://newsbynation.web.app';
const DATE = '3 Aprile 2026';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-[100dvh] bg-[#050B14] text-white font-sans px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-10">
          <Link to="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Torna alla Home
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <span className="font-extrabold text-xl">NewsByNation PRO</span>
        </div>
        <h1 className="text-3xl font-extrabold mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Ultimo aggiornamento: {DATE}</p>

        <div className="space-y-8 text-gray-300 leading-relaxed text-sm">

          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Titolare del Trattamento</h2>
            <p>Il Titolare del Trattamento dei dati personali è <strong className="text-white">{OWNER}</strong>.</p>
            <p className="mt-1">Contatto: <a href={`mailto:${EMAIL}`} className="text-blue-400 hover:underline">{EMAIL}</a></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Dati Raccolti e Finalità</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-white">Dati di registrazione</strong>: email e credenziali per l'autenticazione tramite Firebase Authentication (Google LLC). Base giuridica: esecuzione del contratto (Art. 6.1.b GDPR).</li>
              <li><strong className="text-white">Dati di preferenza</strong>: lista delle nazioni preferite dell'utente, salvata su Firebase Firestore. Base giuridica: esecuzione del contratto.</li>
              <li><strong className="text-white">Dati analitici</strong>: dati anonimi di navigazione tramite Google Analytics 4. Base giuridica: consenso.</li>
              <li><strong className="text-white">Dati di profilazione e retargeting</strong>: dati di navigazione e interazione (es. nazioni visualizzate) tramite <strong className="text-white">Meta Pixel</strong> e <strong className="text-white">Google Ads Remarketing</strong>. Questi dati vengono utilizzati per mostrarti annunci pertinenti su Facebook, Instagram e sulla rete Google. Base giuridica: <strong className="text-white">consenso dell'interessato</strong> (Art. 6.1.a GDPR).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Cookie</h2>
            <p>Il sito utilizza cookie tecnici (sempre attivi) e cookie analitici/pubblicitari (attivi solo previo consenso). Per l'elenco dettagliato consulta la nostra <Link to="/cookie-policy" className="text-blue-400 hover:underline">Cookie Policy</Link>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Trasferimento Extra-UE</h2>
            <p>I dati vengono trasferiti negli USA a <strong className="text-white">Google LLC</strong>, certificata ai sensi del Data Privacy Framework UE-USA. La base giuridica è l'Art. 45 GDPR (decisione di adeguatezza). Per maggiori informazioni: <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Privacy Policy Google</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Conservazione dei Dati</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Dati di account: conservati fino alla cancellazione dell'account da parte dell'utente.</li>
              <li>Dati analitici (GA4): conservati per 14 mesi, poi anonimizzati automaticamente da Google.</li>
              <li>Cookie: durata indicata nella Cookie Policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Diritti dell'Interessato (Art. 15-22 GDPR)</h2>
            <p>Hai diritto di: accesso, rettifica, cancellazione ("diritto all'oblio"), limitazione del trattamento, portabilità, opposizione e revoca del consenso in qualsiasi momento. Per esercitare i tuoi diritti scrivi a: <a href={`mailto:${EMAIL}`} className="text-blue-400 hover:underline">{EMAIL}</a>. Hai inoltre diritto di proporre reclamo al <strong className="text-white">Garante per la Protezione dei Dati Personali</strong> (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">www.garanteprivacy.it</a>).</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Minori</h2>
            <p>Il servizio non è destinato a persone di età inferiore ai 16 anni. Non raccogliamo consapevolmente dati di minori. Se ritieni che dati di un minore siano stati raccolti, contattaci immediatamente all'indirizzo sopra indicato.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Modifiche alla Privacy Policy</h2>
            <p>Il Titolare si riserva di modificare questa policy in qualsiasi momento, notificando gli utenti tramite il sito ({SITE_URL}). La data in alto indica l'ultima versione aggiornata.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
