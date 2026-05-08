import React, { useState } from 'react';
import { sendPasswordResetEmail, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../services/firebase';
import { Globe, Lock, Mail, ArrowRight, Eye, EyeOff, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Mode = 'login' | 'register' | 'reset';

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const switchMode = (next: Mode) => {
    setError('');
    setSuccessMsg('');
    setPassword('');
    setMode(next);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/app');
      } else if (mode === 'register') {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/app');
      } else if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMsg('Email di recupero inviata. Controlla la tua casella di posta.');
      }
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Email o password non corretti.');
      } else if (code === 'auth/email-already-in-use') {
        setError('Questa email è già registrata. Prova ad accedere.');
      } else if (code === 'auth/weak-password') {
        setError('La password deve contenere almeno 6 caratteri.');
      } else if (code === 'auth/invalid-email') {
        setError('Indirizzo email non valido.');
      } else if (code === 'auth/too-many-requests') {
        setError('Troppi tentativi. Riprova tra qualche minuto.');
      } else if (code === 'auth/user-disabled') {
        setError('Account disabilitato. Contatta il supporto.');
      } else {
        setError('Operazione non riuscita. Riprova più tardi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/app');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setError('Hai chiuso la finestra di accesso. Riprova.');
      } else if (code === 'auth/too-many-requests') {
        setError('Troppi tentativi. Riprova tra qualche minuto.');
      } else {
        setError('Accesso tramite Google non riuscito. Riprova.');
      }
    } finally {
      setLoading(false);
    }
  };

  const headings: Record<Mode, { title: string; subtitle: string }> = {
    login: {
      title: 'Accedi',
      subtitle: "L'hub definitivo per l'intelligence di mercato.",
    },
    register: {
      title: 'Crea Account',
      subtitle: 'Accesso gratuito. Nessuna carta di credito.',
    },
    reset: {
      title: 'Recupera Password',
      subtitle: 'Ti invieremo un link per reimpostare la password.',
    },
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#050B14] overflow-hidden flex items-center justify-center font-sans">
      {/* Back button — large touch target */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
      >
        <ChevronLeft className="w-4 h-4" />
        Indietro
      </button>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/30 via-[#050B14] to-[#050B14] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />

      <div className="relative z-10 w-full max-w-md p-8 glass-panel rounded-3xl border border-white/10 shadow-2xl mx-4">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-5 border border-white/20">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-display text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-blue-200 tracking-tight">
            {headings[mode].title}
          </h1>
          <p className="text-gray-400 mt-2 font-medium">{headings[mode].subtitle}</p>
        </div>

        {error && (
          <div className="mb-5 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium text-center">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-5 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Indirizzo Email"
              className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Password — hidden in reset mode */}
          {mode !== 'reset' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min 6 caratteri)"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          )}

          {/* Forgot password link — only in login mode */}
          {mode === 'login' && (
            <div className="flex justify-end -mt-1">
              <button
                type="button"
                onClick={() => switchMode('reset')}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Password dimenticata?
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full group bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70 mt-1"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' && 'Entra nel Terminale'}
                {mode === 'register' && 'Crea Account Gratuito'}
                {mode === 'reset' && 'Invia Email di Recupero'}
                {mode !== 'reset' && <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />}
              </>
            )}
          </button>
        </form>

        {/* Google sign-in — only for login/register */}
        {mode !== 'reset' && (
          <>
            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Oppure</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center py-3.5 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-70"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.02 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Continua con Google
            </button>
          </>
        )}

        {/* Mode switcher footer */}
        <div className="mt-7 pt-6 border-t border-white/5 flex flex-col items-center gap-3">
          {mode === 'login' && (
            <p className="text-sm text-gray-400">
              Non hai un account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Registrati gratis
              </button>
            </p>
          )}
          {mode === 'register' && (
            <p className="text-sm text-gray-400">
              Hai già un account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="font-bold text-blue-400 hover:text-blue-300 transition-colors"
              >
                Accedi
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Torna al login
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
