import { Link } from 'react-router-dom';
import { Globe, ArrowLeft } from 'lucide-react';

const DATE = '3 Aprile 2026';

const COOKIES: { name: string; type: string; provider: string; purpose: string; duration: string }[] = [
  { name: 'firebase:authUser:*', type: 'Tecnico', provider: 'Firebase / Google', purpose: 'Mantiene la sessione di autenticazione dell\'utente loggato', duration: 'Sessione' },
  { name: 'onboarding_done', type: 'Tecnico', provider: 'NewsByNation PRO', purpose: 'Ricorda se l\'utente ha completato il tutorial iniziale', duration: '1 anno' },
  { name: 'cookie_consent', type: 'Tecnico', provider: 'NewsByNation PRO', purpose: 'Salva la scelta del consenso cookie dell\'utente', duration: '1 anno' },
  { name: '_ga, _ga_*', type: 'Analitico', provider: 'Google Analytics 4', purpose: 'Statistiche di navigazione anonime', duration: '2 anni' },
  { name: '_fbp, _fbc', type: 'Profilazione', provider: 'Meta Platforms, Inc.', purpose: 'Tracciamento per retargeting pubblicitario su Facebook/Instagram', duration: '3 mesi' },
  { name: 'fr, tr', type: 'Profilazione', provider: 'Meta Platforms, Inc.', purpose: 'Funzionalità pubblicitarie di Facebook', duration: '3 mesi' },
  { name: 'IDE, DSID', type: 'Profilazione', provider: 'Google Ads', purpose: 'Personalizzazione e targeting degli annunci (Remarketing)', duration: '1 anno' },
];

export default function CookiePolicy() {
  return (
    <div className="min-h-[100dvh] bg-[#050B14] text-white font-sans px-4 py-12">
      <div className="max-w-3xl mx-auto">
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
        <h1 className="text-3xl font-extrabold mb-2">Cookie Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Ultimo aggiornamento: {DATE} · Documento richiesto dal <strong className="text-gray-300">Garante Privacy Italiano</strong> (Provvedimento 8 maggio 2014)</p>

        <div className="space-y-8 text-gray-300 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">Cosa sono i Cookie?</h2>
            <p>I cookie sono piccoli file di testo che i siti web memorizzano sul dispositivo dell'utente. Consentono al sito di riconoscere il browser e salvare preferenze o informazioni di sessione.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Tipologie di Cookie Utilizzate</h2>
            <ul className="space-y-3">
              <li><span className="bg-gray-700 text-white text-xs px-2 py-0.5 rounded font-bold">Tecnici</span> — Necessari per il corretto funzionamento del sito (login, consenso, tutorial). Non richiedono consenso ai sensi dell'Art. 122 D.Lgs. 196/2003.</li>
              <li><span className="bg-blue-800 text-blue-200 text-xs px-2 py-0.5 rounded font-bold">Analitici</span> — Google Analytics 4, in modalità anonimizzata. Richiedono consenso se trasmettono dati identificativi a terze parti.</li>
              <li><span className="bg-purple-900 text-purple-200 text-xs px-2 py-0.5 rounded font-bold">Profilazione</span> — Meta Pixel e Google Ads per retargeting e creazione di pubblici personalizzati. Richiedono consenso esplicito.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Elenco Dettagliato dei Cookie</h2>
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-white/5 text-gray-400">
                    <th className="text-left p-3 font-semibold">Nome</th>
                    <th className="text-left p-3 font-semibold">Tipo</th>
                    <th className="text-left p-3 font-semibold">Provider</th>
                    <th className="text-left p-3 font-semibold hidden sm:table-cell">Finalità</th>
                    <th className="text-left p-3 font-semibold">Durata</th>
                  </tr>
                </thead>
                <tbody>
                  {COOKIES.map((c, i) => (
                    <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 font-mono text-blue-300 whitespace-nowrap">{c.name}</td>
                      <td className="p-3 whitespace-nowrap text-gray-400">{c.type}</td>
                      <td className="p-3 whitespace-nowrap text-gray-400">{c.provider}</td>
                      <td className="p-3 text-gray-400 hidden sm:table-cell">{c.purpose}</td>
                      <td className="p-3 whitespace-nowrap text-gray-400">{c.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Come Gestire i Cookie</h2>
            <p>Puoi modificare il tuo consenso in qualsiasi momento tramite le impostazioni del browser oppure aggiornando la tua scelta attraverso il banner cookie che apparirà alla prossima visita (cancella i cookie del sito per rivederlo).</p>
            <p className="mt-2">Link alle impostazioni dei principali browser: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Chrome</a>, <a href="https://support.mozilla.org/it/kb/Attivare%20e%20disattivare%20i%20cookie" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Firefox</a>, <a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Safari</a>.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Privacy Policy</h2>
            <p>Per informazioni complete sul trattamento dei dati personali consulta la nostra <Link to="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
