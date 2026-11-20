import { useState } from 'react'
import { ArrowRight, HeartPulse, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { supabase } from './supabase'
import './auth.css'

function messageFor(error) {
  const text = error?.message || 'Authentication could not be completed.'
  if (/invalid login credentials/i.test(text)) return 'Email or password is incorrect. Check your details and try again.'
  if (/email not confirmed/i.test(text)) return 'Confirm your email using the link we sent, then sign in.'
  if (/already registered|user already exists/i.test(text)) return 'An account already uses this email. Sign in instead.'
  if (/rate limit/i.test(text)) return 'Too many attempts. Wait a little and try again.'
  if (/fetch failed|failed to fetch|network/i.test(text)) return 'Could not reach Supabase. Check the project URL and your internet connection.'
  return text
}

export function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const isLogin = mode === 'login'
  const isForgot = mode === 'forgot'

  async function submit(event) {
    event.preventDefault(); setBusy(true); setError(''); setNotice('')
    try {
      if (isForgot) {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
        if (resetError) throw resetError
        setNotice('If an account exists for that email, a password reset link will be sent.')
      } else if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (signInError) throw signInError
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { full_name: name.trim() }, emailRedirectTo: window.location.origin },
        })
        if (signUpError) throw signUpError
        if (!data.session) setNotice('Check your email and confirm your account before signing in.')
      }
    } catch (authError) {
      setError(messageFor(authError))
    } finally {
      setBusy(false)
    }
  }

  return <div className="auth-screen"><section className="auth-panel"><a className="auth-brand" href="/"><span className="brand-mark"><HeartPulse size={21}/></span><span>clarity<span className="brand-soft">health</span></span></a><div className="auth-intro"><span className="eyebrow">YOUR PERSONAL HEALTH SPACE</span><h1>{isForgot ? 'Reset your password' : isLogin ? 'Welcome back.' : 'Create your account.'}</h1><p>{isForgot ? 'We’ll send a secure password reset link if an account exists.' : isLogin ? 'Sign in to continue to your health dashboard.' : 'Create an account to access your personal dashboard.'}</p></div><form className="auth-form" onSubmit={submit}>
    {!isLogin && !isForgot && <><label htmlFor="auth-name">Name</label><input id="auth-name" autoComplete="name" value={name} onChange={event=>setName(event.target.value)} placeholder="Your name" required maxLength={80}/></>}
    <label htmlFor="auth-email">Email address</label><span className="auth-input"><Mail size={16}/><input id="auth-email" type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="you@example.com" required/></span>
    {!isForgot && <><label htmlFor="auth-password">Password</label><span className="auth-input"><LockKeyhole size={16}/><input id="auth-password" type="password" autoComplete={isLogin?'current-password':'new-password'} value={password} onChange={event=>setPassword(event.target.value)} minLength={6} placeholder="At least 6 characters" required/></span></>}
    {isLogin && <button className="auth-forgot" type="button" onClick={()=>{setMode('forgot');setError('');setNotice('')}}>Forgot password?</button>}
    {error && <div className="auth-message error">{error}</div>}{notice && <div className="auth-message success">{notice}</div>}
    <button className="button button-primary auth-submit" disabled={busy}>{busy?'Please wait…':isForgot?'Send reset link':isLogin?'Sign in':'Create account'}{!busy&&<ArrowRight size={16}/>}</button>
  </form><div className="auth-switch">{isForgot ? <button onClick={()=>setMode('login')}>Back to sign in</button> : isLogin ? <>New to Clarity? <button onClick={()=>{setMode('signup');setError('');setNotice('')}}>Create an account</button></> : <>Already have an account? <button onClick={()=>{setMode('login');setError('');setNotice('')}}>Sign in</button></>}</div><div className="auth-privacy"><ShieldCheck size={14}/> Your account is managed securely by Supabase.</div></section><aside className="auth-aside"><div className="auth-orb"><HeartPulse size={58}/></div><span className="eyebrow">CARE STARTS WITH CLARITY</span><h2>A thoughtful space for your health journey.</h2><p>Your account keeps your personal dashboard ready when you need it.</p><div className="auth-disclaimer">Clarity Health is an educational tool and does not provide medical diagnoses.</div></aside></div>
}

export function PasswordRecovery({ onComplete }) {
  const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('')
  async function submit(event){event.preventDefault();setBusy(true);setError('');try{const {error: updateError}=await supabase.auth.updateUser({password});if(updateError)throw updateError;onComplete()}catch(err){setError(messageFor(err))}finally{setBusy(false)}}
  return <div className="auth-screen recovery-screen"><section className="auth-panel"><a className="auth-brand" href="/"><span className="brand-mark"><HeartPulse size={21}/></span><span>clarity<span className="brand-soft">health</span></span></a><div className="auth-intro"><span className="eyebrow">ACCOUNT SECURITY</span><h1>Choose a new password.</h1><p>Set a new password to finish recovering your account.</p></div><form className="auth-form" onSubmit={submit}><label htmlFor="new-password">New password</label><span className="auth-input"><LockKeyhole size={16}/><input id="new-password" type="password" value={password} onChange={event=>setPassword(event.target.value)} minLength={6} required autoComplete="new-password"/></span>{error&&<div className="auth-message error">{error}</div>}<button className="button button-primary auth-submit" disabled={busy}>{busy?'Saving…':'Save new password'}{!busy&&<ArrowRight size={16}/>}</button></form></section></div>
}

export function AuthLoading() { return <div className="loading"><span className="brand-mark"><HeartPulse size={21}/></span><span className="auth-spinner"/><span>Checking your session…</span></div> }

export function SupabaseSetup() { return <div className="setup-screen"><div className="panel setup-panel"><span className="brand-mark"><HeartPulse size={22}/></span><h1>Supabase settings are missing</h1><p>Add the project URL and publishable key to <code>frontend/.env</code>, then restart the frontend.</p><code>VITE_SUPABASE_URL<br/>VITE_SUPABASE_PUBLISHABLE_KEY</code></div></div> }
