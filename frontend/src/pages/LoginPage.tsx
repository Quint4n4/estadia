import React, { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../api/auth.service';
import { getRoleHome } from '../utils/roleUtils';
import { Lock, AlertTriangle } from 'lucide-react';
import '../styles/LoginPage.css';

interface LockState {
  remaining:        number;   // seconds left
  lockedUntil:      string;   // ISO string from backend
  unlockRequested:  boolean;
  email:            string;
}

const LOGIN_BG_IMG =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBc5Kbs1wstVB0FlZKpd4pVITL90GDjpsWjdsukRr5zR4k989P686myeyvCT2Uudew-E-yUzMx1_4Y7fOv_yLqpA38z_KZ4fDrVEiaLiuc7UvERqZ2PhU9i96YI3U7hAh86kzzxT53sYY3txm45RSnVVK--W2VjeIARLZmaQoHCHoOnMfoxBlQwfVTY64GLEvamAfsU2Q7OlLPKxHi1NYp3tRSBm6tm4nDVQF9WRIfFN_kbx2BvraTfuoZeUpiR_PpqEDugiTRfE3c2';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);

  // Remaining-attempts warning (1–4 left before lockout)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  // Lockout state
  const [lockState, setLockState] = useState<LockState | null>(null);

  // Unlock-request feedback
  const [unlockMsg, setUnlockMsg]       = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);

  // Session-expired message from axios interceptor / logout
  useEffect(() => {
    const msg = sessionStorage.getItem('session_expired_msg');
    if (msg) {
      setError(msg);
      sessionStorage.removeItem('session_expired_msg');
    }
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (!lockState || lockState.remaining <= 0) return;
    const timer = setTimeout(() => {
      setLockState((prev) => {
        if (!prev) return null;
        if (prev.remaining <= 1) return null; // auto-unlock on expiry
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, [lockState?.remaining]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setRemainingAttempts(null);
    setIsLoading(true);

    try {
      const user = await login({ email, password });
      navigate(getRoleHome(user.role));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;

        if (data?.locked === true) {
          // Account is now locked
          setLockState({
            remaining:       data.remaining_seconds ?? 1800,
            lockedUntil:     data.locked_until ?? '',
            unlockRequested: data.unlock_requested ?? false,
            email,
          });
          setError('');
        } else if (data?.locked === false && data?.remaining_attempts != null) {
          // Wrong credentials but not yet locked
          setRemainingAttempts(data.remaining_attempts);
          setError(data.message ?? 'Credenciales incorrectas.');
        } else {
          setError(
            data?.message ??
            'Error al iniciar sesión. Verifica tus credenciales.'
          );
        }
      } else {
        console.error('[LoginPage] Error inesperado:', err);
        setError('Error al iniciar sesión. Verifica tus credenciales.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestUnlock = async () => {
    if (!lockState) return;
    setUnlockLoading(true);
    setUnlockMsg('');
    try {
      const r = await authService.requestUnlock(lockState.email);
      setUnlockMsg(r.message);
      setLockState((prev) => prev ? { ...prev, unlockRequested: true } : null);
    } catch (err: unknown) {
      console.error('[LoginPage] Error al solicitar desbloqueo:', err);
      setUnlockMsg('No se pudo enviar la solicitud. Intenta de nuevo.');
    } finally {
      setUnlockLoading(false);
    }
  };

  const fmtCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const isLocked = !!lockState && lockState.remaining > 0;

  return (
    <div className="login-page">
      <div className="login-bg-layer" aria-hidden>
        <img src={LOGIN_BG_IMG} alt="" />
      </div>

      <main className="login-main">
        <div className="login-main-inner">
          <div className="login-brand">
            <div className="login-brand-mark">
              <span className="material-symbols-outlined login-brand-icon">motorcycle</span>
            </div>
            <h1 className="login-brand-title">MotoQFox</h1>
            <p className="login-brand-tagline">Sistema de Inventario y Punto de Venta</p>
          </div>

          <div className={`login-card${isLocked ? ' login-card--wide' : ''}`}>
            {isLocked ? (
              <div className="lock-panel">
                <Lock size={48} className="lock-icon" />
                <h3 className="lock-title">Cuenta bloqueada temporalmente</h3>
                <p className="lock-subtitle">
                  Demasiados intentos fallidos. Vuelve a intentarlo en:
                </p>
                <div className="lock-countdown">{fmtCountdown(lockState.remaining)}</div>

                <div className="lock-actions">
                  {!lockState.unlockRequested ? (
                    <button
                      type="button"
                      className="lock-btn lock-btn--primary"
                      onClick={handleRequestUnlock}
                      disabled={unlockLoading}
                    >
                      {unlockLoading ? 'Enviando...' : 'Solicitar desbloqueo al administrador'}
                    </button>
                  ) : (
                    <div className="lock-requested-badge">
                      Solicitud enviada al administrador
                    </div>
                  )}

                  {unlockMsg && (
                    <p className="lock-feedback">{unlockMsg}</p>
                  )}

                  <Link to="/forgot-password" className="lock-btn lock-btn--secondary">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="login-form">
                <div className="login-welcome">
                  <h2>Bienvenido</h2>
                  <p>Ingresa tus credenciales para acceder al taller.</p>
                </div>

                {error && (
                  <div className="error-message">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                {remainingAttempts !== null && remainingAttempts <= 3 && (
                  <div className="attempts-warning">
                    <AlertTriangle size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                    Te queda{remainingAttempts !== 1 ? 'n' : ''}{' '}
                    <strong>{remainingAttempts}</strong> intento{remainingAttempts !== 1 ? 's' : ''} antes
                    de que la cuenta se bloquee por {30} minutos.
                  </div>
                )}

                <div className="login-field">
                  <label htmlFor="email" className="login-label">Correo Electrónico</label>
                  <div className="login-input-wrap">
                    <span className="material-symbols-outlined login-input-icon" aria-hidden>mail</span>
                    <input
                      id="email"
                      className="login-input"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mecanico@motoqfox.com"
                      required
                      disabled={isLoading}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="login-field">
                  <div className="login-label-row">
                    <label htmlFor="password" className="login-label">Contraseña</label>
                    <Link to="/forgot-password" className="forgot-link">
                      ¿Olvidaste tu contraseña?
                    </Link>
                  </div>
                  <div className="login-input-wrap login-input-wrap--password">
                    <span className="material-symbols-outlined login-input-icon" aria-hidden>lock</span>
                    <input
                      id="password"
                      className="login-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      <span className="material-symbols-outlined">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="login-button-wrap">
                  <button type="submit" className="login-button" disabled={isLoading}>
                    {isLoading ? (
                      <span className="loading-spinner">Iniciando sesión...</span>
                    ) : (
                      <>
                        <span>Iniciar Sesión</span>
                        <span className="material-symbols-outlined login-button-arrow" aria-hidden>
                          arrow_forward
                        </span>
                      </>
                    )}
                  </button>
                </div>

                <div className="login-help-line">
                  ¿No tienes cuenta?{' '}
                  <a href="#">Contacta al Administrador</a>
                </div>
              </form>
            )}
          </div>

          <div className="login-dots" aria-hidden>
            <span /><span /><span />
          </div>
        </div>
      </main>

      <footer className="login-site-footer">
        <div className="login-site-footer-inner">
          <p className="login-site-footer-copy">© 2026 MotoQFox. Todos los derechos reservados.</p>
          <div className="login-site-footer-links">
            <a href="#">Privacidad</a>
            <a href="#">Términos</a>
            <a href="#">Soporte</a>
          </div>
        </div>
      </footer>

      <div className="login-corner-deco" aria-hidden />
    </div>
  );
};

export default LoginPage;
