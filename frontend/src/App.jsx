import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Activity, ArrowLeft, ArrowRight, BadgeCheck, Clock3, HeartPulse, LayoutDashboard, LockKeyhole, LogOut, Search, ShieldCheck, Sparkles, Stethoscope, UserRound, Trash2 } from 'lucide-react'
import { supabase, supabaseConfigured } from './supabase'
import { AuthLoading, AuthScreen, PasswordRecovery, SupabaseSetup } from './Auth'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const State = createContext(null)
const useApp = () => useContext(State)
const sections = [['Overview', '/', LayoutDashboard], ['Symptom checker', '/checker', Activity], ['History', '/history', Clock3], ['Profile', '/profile', UserRound]]
const pretty = text => text.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase())
const safeRead = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback } }

async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options.headers } })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(typeof data.detail === 'string' ? data.detail : data.detail?.message || 'The request failed. Please try again.')
  return data
}

function App() {
  const [session, setSession] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [recovering, setRecovering] = useState(false)
  const [history, setHistory] = useState([])
  const [name, setName] = useState('')
  const [loadedFor, setLoadedFor] = useState(null)
  const userId = session?.user?.id || null
  const historyKey = userId ? `clarity-history:${userId}` : null
  const nameKey = userId ? `clarity-name:${userId}` : null

  useEffect(() => {
    if (!supabase) { setAuthReady(true); return }
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      setSession(data?.session || null)
      setAuthReady(true)
      if (error) console.warn('Could not restore the Supabase session.', error.message)
    }).catch(error => {
      if (active) { setSession(null); setAuthReady(true); console.warn('Could not restore the Supabase session.', error.message) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession)
      setAuthReady(true)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => { active = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!userId) { setHistory([]); setName(''); setLoadedFor(null); return }
    setHistory(safeRead(historyKey, []))
    setName(localStorage.getItem(nameKey) || session?.user?.user_metadata?.full_name || '')
    setLoadedFor(userId)
  }, [userId])
  useEffect(() => {
    if (userId && loadedFor === userId) {
      localStorage.setItem(historyKey, JSON.stringify(history))
      localStorage.setItem(nameKey, name)
    }
  }, [history, name, userId, loadedFor, historyKey, nameKey])

  const value = useMemo(() => ({ history, setHistory, name, setName, session, supabase, historyKey }), [history, name, session, historyKey])
  if (!supabaseConfigured) return <SupabaseSetup />
  if (!authReady) return <AuthLoading />
  if (recovering) return <PasswordRecovery onComplete={() => setRecovering(false)} />
  if (!session) return <AuthScreen />
  return <State.Provider value={value}><Shell /></State.Provider>
}

function Shell() {
  const { session, supabase } = useApp()
  const location = useLocation()
  const email = session.user.email || 'Signed-in user'
  return <div className="shell"><aside className="sidebar"><Link className="brand" to="/"><span className="brand-mark"><HeartPulse size={22}/></span><span>clarity<span className="brand-soft">health</span><small>PERSONAL HEALTH SPACE</small></span></Link><div className="nav-caption">YOUR SPACE</div><nav>{sections.map(([title, href, Icon]) => <NavLink key={href} to={href} end={href === '/'} className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Icon size={18}/>{title}</NavLink>)}</nav><div className="sidebar-foot"><div className="privacy-mini"><ShieldCheck size={16}/><div><b>Private account</b><span>Your check-ins stay in this browser.</span></div></div><div className="account-mini"><span className="account-dot">{(email[0]||'U').toUpperCase()}</span><span title={email}>{email}</span><button onClick={()=>supabase.auth.signOut()} aria-label="Sign out" title="Sign out"><LogOut size={15}/></button></div></div></aside><main className="main"><header className="topbar"><div className="crumb">Your health <span>/</span> <b>{titleFor(location.pathname)}</b></div><span className="secure"><LockKeyhole size={14}/> Signed in securely</span></header><div className="content"><Routes><Route path="/" element={<Dashboard/>}/><Route path="/checker" element={<Checker/>}/><Route path="/result/:id" element={<Result/>}/><Route path="/history" element={<History/>}/><Route path="/profile" element={<Profile/>}/><Route path="*" element={<Dashboard/>}/></Routes></div><footer><span>Clarity Health · Educational use only</span><span>Not a substitute for professional medical care</span></footer></main></div>
}
function titleFor(path) { if (path === '/checker') return 'Symptom checker'; if (path === '/history') return 'History'; if (path === '/profile') return 'Profile'; if (path.startsWith('/result')) return 'Your result'; return 'Overview' }

function Heading({ eyebrow, title, description, action }) { return <div className="heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div> }
function Dashboard() {
  const { history, name } = useApp(); const latest = history.slice(0, 3)
  return <><section className="hero"><div className="hero-text"><span className="hero-label"><Sparkles size={14}/> A little more clarity, every day</span><h1>{name ? `Good to see you, ${name.split(' ')[0]}.` : 'How are you feeling today?'}</h1><p>A thoughtful space to check in with yourself and keep track of what you notice.</p><Link to="/checker" className="button button-white">Start a symptom check <ArrowRight size={16}/></Link></div><div className="hero-graphic"><div className="hero-orbit"/><div className="hero-heart"><HeartPulse size={48}/></div></div></section><div className="stats"><Stat icon={<Activity size={18}/>} label="Total check-ins" value={history.length} note="Saved in this browser" tone="blue"/><Stat icon={<Clock3 size={18}/>} label="Most recent" value={latest[0] ? dateShort(latest[0].createdAt) : '—'} note={latest[0] ? latest[0].disease : 'Start your first check-in'} tone="violet"/><Stat icon={<ShieldCheck size={18}/>} label="Your privacy" value="Account protected" note="Check-ins remain on this device" tone="green"/></div><div className="columns"><section className="panel recent"><div className="panel-title"><div><div className="eyebrow">YOUR TIMELINE</div><h2>Recent check-ins</h2></div><Link className="text-link" to="/history">Full history <ArrowRight size={14}/></Link></div>{latest.length ? latest.map((item,index)=><Link className="recent-row" to={`/result/${item.id}`} key={item.id}><span className={`round-icon tone-${index%3}`}><Activity size={17}/></span><span className="recent-copy"><b>{item.disease}</b><small>{item.symptoms.length} symptoms · {dateShort(item.createdAt)}</small></span><ArrowRight className="muted" size={16}/></Link>) : <div className="empty"><span><HeartPulse size={23}/></span><b>Your timeline starts here</b><p>Complete a symptom check to see your previous check-ins.</p><Link className="text-link" to="/checker">Start your first check <ArrowRight size={14}/></Link></div>}</section><aside className="panel quick"><div className="eyebrow">QUICK ACTION</div><span className="quick-icon"><Stethoscope size={21}/></span><h3>Check in with yourself</h3><p>Pick the symptoms you're experiencing and get a model-generated suggestion.</p><Link to="/checker" className="button button-primary full">Open symptom checker <ArrowRight size={16}/></Link><div className="quick-foot"><Clock3 size={13}/> About 2 minutes</div></aside></div><div className="disclaimer"><ShieldCheck size={15}/><span>This is an educational tool. Results are not diagnoses or medical advice.</span></div></>
}
function Stat({icon,label,value,note,tone}) { return <article className="stat"><span className={`stat-icon ${tone}`}>{icon}</span><span className="stat-label">{label}</span><b className="stat-value">{value}</b><small>{note}</small></article> }
function dateShort(value) { if (!value) return '—'; return new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric'}) }
function dateLong(value) { if (!value) return ''; return new Date(value).toLocaleString() }

function categoryOf(raw) {
  const s = raw.toLowerCase().replaceAll('_',' ')
  if (/skin|rash|itch|acne|blister|eruption|nail|hair|pigment|crust|scur|ulcer|wound|wart/.test(s)) return 'Skin'
  if (/cough|breath|throat|nose|sneeze|sinus|phlegm|congestion|sputum|lung|chest|snore|voice|respirat/.test(s)) return 'Respiratory'
  if (/stomach|abdom|nausea|vomit|diarr|constipat|bowel|appetite|indigestion|heartburn|urine|urinary|bladder|rectal|anus|gastric|jaundice|liver|belly/.test(s)) return 'Digestive'
  if (/pain|ache|joint|muscle|back|neck|limb|leg|arm|foot|feet|hand|swelling|stiff|weakness|paralysis|cramp|tender|tingl|numb|gait|mobility/.test(s)) return 'Pain & body'
  if (/fever|chill|fatigue|tired|headache|dizz|sleep|mood|anxiety|memory|confusion|weight|thirst|sweat|cold|hot|vision|hearing|heart|pulse|blood|eye|ear|mouth|taste|smell/.test(s)) return 'General'
  return 'Other'
}

function Checker() {
  const {setHistory} = useApp()
  const [all,setAll] = useState([]); const [selected,setSelected] = useState(new Set()); const [query,setQuery] = useState(''); const [category,setCategory] = useState('All'); const [notes,setNotes] = useState(''); const [loading,setLoading] = useState(false); const [error,setError] = useState(''); const navigate = useNavigate()
  useEffect(() => { api('/symptoms').then(data => setAll(data.symptoms || [])).catch(err => setError(err.message)) }, [])
  const categories = useMemo(() => ['All', ...new Set(all.map(categoryOf))], [all])
  const shown = useMemo(() => all.filter(item => (category === 'All' || categoryOf(item) === category) && item.toLowerCase().replaceAll('_',' ').includes(query.toLowerCase())), [all,category,query])
  function toggle(item) { setSelected(prev => { const next = new Set(prev); next.has(item) ? next.delete(item) : next.add(item); return next }) }
  async function analyze() { setError(''); setLoading(true); try { const result = await api('/predict',{method:'POST',body:JSON.stringify({symptoms:[...selected],notes})}); const saved={...result,createdAt:new Date().toISOString()}; const next=[saved,...safeRead('clarity-history',[])]; setHistory(next); navigate(`/result/${result.id}`,{state:{result:saved}}) } catch(err) { setError(err.message) } finally { setLoading(false) } }
  return <><Heading eyebrow="SYMPTOM CHECKER" title="Let's start with how you feel." description="Choose the symptoms you're experiencing. Select all that apply."/><div className="check-layout"><section className="panel check-panel"><div className="search"><Search size={17}/><input aria-label="Search symptoms" placeholder="Search symptoms…" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="categories">{categories.map(value=><button key={value} onClick={()=>setCategory(value)} className={category===value?'chosen':''}>{value}{value==='All'&&<small>{all.length}</small>}</button>)}</div><div className="check-subhead"><div><h2>What are you experiencing?</h2><p>Your selection stays in this browser.</p></div><span className="count"><b>{selected.size}</b> selected</span></div>{error&&!all.length?<div className="error-state"><b>Unable to load symptoms</b><p>{error}</p><small>Start the API and make sure the model files are in backend/models.</small></div>:<div className="symptom-list">{shown.map(item=><button key={item} onClick={()=>toggle(item)} className={`symptom ${selected.has(item)?'selected':''}`}><span>{selected.has(item)?'✓':''}</span>{pretty(item)}</button>)}{!shown.length&&<p className="no-results">No matching symptoms.</p>}</div>}<label className="notes-label" htmlFor="notes">Additional notes <small>OPTIONAL</small></label><textarea id="notes" value={notes} maxLength={1000} onChange={e=>setNotes(e.target.value)} placeholder="Add a note to help you remember how you've been feeling…"/><div className="actions"><button className="button button-quiet" onClick={()=>{setSelected(new Set());setNotes('');setError('')}} disabled={!selected.size&&!notes}>Clear all</button><button className="button button-primary" onClick={analyze} disabled={!selected.size||loading}>{loading?'Analyzing…':<>Analyze symptoms <ArrowRight size={16}/></>}</button></div>{error&&all.length>0&&<div className="inline-error">{error}</div>}</section><aside className="check-aside"><div className="panel selection"><div className="eyebrow">YOUR SELECTION</div><strong>{selected.size}</strong><p>{selected.size===1?'symptom':'symptoms'} selected</p>{selected.size?<div className="chips">{[...selected].slice(0,9).map(item=><span key={item}>{pretty(item)}</span>)}{selected.size>9&&<span>+{selected.size-9} more</span>}</div>:<div className="selection-empty"><Activity size={18}/>Selected symptoms appear here.</div>}</div><div className="panel note"><ShieldCheck size={18}/><div><b>Private by design</b><p>History and notes are saved only in this browser.</p></div></div><div className="panel note lavender"><Sparkles size={17}/><div><b>A gentle reminder</b><p>This tool is educational, not a substitute for qualified medical care.</p></div></div></aside></div></>
}

function Result() {
  const {id}=useParams(); const location=useLocation(); const navigate=useNavigate(); const {history}=useApp(); const result=location.state?.result || history.find(item=>item.id===id)
  if(!result) return <section className="panel empty-result"><h2>That result isn't in this browser</h2><p>Local browser history may have been cleared.</p><Link className="button button-primary" to="/checker">Start a new check</Link></section>
  return <><button className="back" onClick={()=>navigate('/checker')}><ArrowLeft size={15}/> Back to symptom checker</button><section className="result-hero"><div className="eyebrow"><Sparkles size={14}/> YOUR CHECK-IN RESULT</div><h1>Here's what the model found.</h1><p>Use this result as a prompt for a conversation with a healthcare professional.</p></section><div className="result-layout"><section className="panel result-card"><div className="eyebrow">MODEL PREDICTION</div><span className="result-icon"><HeartPulse size={25}/></span><h2>{result.disease}</h2><p className="result-caveat">This is an AI-generated suggestion, not a confirmed diagnosis.</p>{result.confidence!=null&&<div className="confidence"><div><span>Model confidence</span><b>{result.confidence}%</b></div><div className="bar"><i style={{width:`${result.confidence}%`}}/></div><small>This score reflects the model output; it is not the probability you have this condition.</small></div>}<div className="result-symptoms"><h3>Symptoms you selected <span>{result.symptoms.length}</span></h3><div className="chips">{result.symptoms.map(item=><span key={item}>{pretty(item)}</span>)}</div></div>{result.notes&&<div className="saved-notes"><b>Your note</b><p>{result.notes}</p></div>}<div className="result-actions"><Link className="button button-primary" to="/checker">New symptom check <ArrowRight size={16}/></Link><Link className="button button-quiet" to="/history">View history</Link></div></section><aside className="panel next-steps"><span className="next-icon"><Stethoscope size={20}/></span><h3>What to do next</h3><ul><li>Keep track of your symptoms and any changes.</li><li>Share this result with a qualified healthcare professional.</li><li>Seek urgent care if symptoms are severe or worsening.</li></ul><div className="medical-note">This educational tool does not provide medical advice, diagnosis, or treatment.</div></aside></div></>
}

function History() {
  const {history,setHistory,historyKey}=useApp(); const [query,setQuery]=useState(''); const [confirming,setConfirming]=useState(false); const filtered=history.filter(item=>item.disease.toLowerCase().includes(query.toLowerCase()))
  function clear(){setHistory([]);if(historyKey)localStorage.removeItem(historyKey);setConfirming(false)}
  return <><Heading eyebrow="YOUR TIMELINE" title="Prediction history" description="Check-ins are saved locally for your signed-in account." action={history.length>0&&<button className="button button-quiet" onClick={()=>setConfirming(true)}><Trash2 size={15}/> Clear history</button>}/>{confirming&&<div className="confirm panel"><span>Clear all local check-ins? This cannot be undone.</span><button className="button button-quiet" onClick={()=>setConfirming(false)}>Cancel</button><button className="button button-danger" onClick={clear}>Clear history</button></div>}<section className="panel history-panel"><div className="search"><Search size={17}/><input placeholder="Search predictions…" value={query} onChange={e=>setQuery(e.target.value)}/></div>{filtered.length?filtered.map(item=><Link className="history-row" to={`/result/${item.id}`} key={item.id}><span className="round-icon tone-0"><Activity size={17}/></span><span className="recent-copy"><b>{item.disease}</b><small>{item.symptoms.length} symptoms · {dateLong(item.createdAt)}</small></span><ArrowRight className="muted" size={16}/></Link>):<div className="empty"><span><Clock3 size={23}/></span><b>{history.length?'No matching check-ins':'Your history is empty'}</b><p>{history.length?'Try a different search.':'Completed symptom checks will appear here.'}</p><Link className="text-link" to="/checker">Start a symptom check <ArrowRight size={14}/></Link></div>}</section></>
}

function Profile() {
  const {name,setName,session,supabase}=useApp(); const [draft,setDraft]=useState(name); const [saved,setSaved]=useState(false); const [error,setError]=useState('')
  useEffect(()=>setDraft(name),[name])
  async function submit(event){event.preventDefault();setError('');const clean=draft.trim();const {error:updateError}=await supabase.auth.updateUser({data:{full_name:clean}});if(updateError){setError(updateError.message);return}setName(clean);setSaved(true);setTimeout(()=>setSaved(false),1800)}
  return <><Heading eyebrow="ACCOUNT" title="Your profile" description="Update the name associated with your Supabase account."/><div className="profile-layout"><section className="panel profile-card"><div className="profile-avatar">{(name||session.user.email||'U').split(' ').map(part=>part[0]).join('').slice(0,2).toUpperCase()}</div><form onSubmit={submit}><label htmlFor="profile-name">Name (optional)</label><input id="profile-name" value={draft} maxLength={80} onChange={e=>setDraft(e.target.value)} placeholder="What should we call you?"/><label>Email</label><input value={session.user.email||''} readOnly aria-readonly="true"/><button className="button button-primary">{saved?<><BadgeCheck size={16}/> Saved</>:'Save profile'}</button>{error&&<p className="inline-error">{error}</p>}</form></section><aside className="panel privacy-card"><ShieldCheck size={21}/><h3>Account and local history</h3><p>Your account is managed by Supabase. Prediction history remains in this browser and is scoped to your signed-in account.</p><button className="button button-quiet" onClick={()=>supabase.auth.signOut()}>Sign out</button></aside></div></>
}

export default App
