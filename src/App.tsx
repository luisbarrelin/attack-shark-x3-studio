import { useEffect, useState, type ReactNode } from 'react';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { disable, enable, isEnabled } from '@tauri-apps/plugin-autostart';
import {
  Activity, Bluetooth, ChevronRight, CircleDot, Gauge, Languages, LayoutDashboard,
  LockKeyhole, MousePointer2, Power, RotateCcw, Settings2, SlidersHorizontal,
  Sparkles, Unplug, Usb, WandSparkles
} from 'lucide-react';
import { messages, type Language, type Messages } from './messages';
import Workspace from './Workspace';

type Preferences = { language: Language; theme: 'system' | 'light' | 'dark'; closeAction: 'exit' | 'tray' };
type Page = 'overview' | 'performance' | 'buttons' | 'macros' | 'profiles' | 'settings';
type PerformanceDraft = { dpi: number[]; selectedDpi: number; polling: 125 | 250 | 500 | 1000; lod: 1 | 2; motionSync: boolean; angleSnapping: boolean; ripple: boolean; debounce: number };

const defaultPreferences: Preferences = { language: 'pt-BR', theme: 'system', closeAction: 'exit' };
const defaultPerformance: PerformanceDraft = { dpi: [400, 800, 1200, 1600, 2400, 3200], selectedDpi: 1, polling: 1000, lod: 1, motionSync: false, angleSnapping: false, ripple: false, debounce: 4 };

const pageIcons = { overview: LayoutDashboard, performance: Gauge, buttons: MousePointer2, macros: WandSparkles, profiles: SlidersHorizontal, settings: Settings2 };

function Toggle({ checked, label, disabled, onChange }: { checked: boolean; label: string; disabled?: boolean; onChange: () => void }) {
  return <button type="button" className={`switch ${checked ? 'on' : ''}`} role="switch" aria-label={label} aria-checked={checked} disabled={disabled} onClick={onChange}><span /></button>;
}

function SettingRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div className="setting-row"><div className="setting-copy"><strong>{title}</strong><p>{description}</p></div><div className="setting-control">{children}</div></div>;
}

function MouseVisual() {
  return <div className="mouse-stage" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="mouse-body"><div className="mouse-split" /><div className="mouse-wheel" /><div className="mouse-sensor" /><span>X3</span></div><div className="mouse-floor" /></div>;
}

function Overview({ t, goToPerformance }: { t: Messages; goToPerformance: () => void }) {
  return <section className="content page-enter" aria-labelledby="overview-title">
    <div className="intro"><div><p className="kicker">{t.deviceControl}</p><h1 id="overview-title">{t.greeting}</h1><p className="lede">{t.greetingDescription}</p></div><div className="preview-badge"><LockKeyhole size={15} aria-hidden="true"/><div><strong>{t.previewMode}</strong><span>{t.previewHint}</span></div></div></div>
    <div className="hero-panel"><div className="hero-copy"><div className="model-line"><span>Attack Shark</span><strong>X3</strong></div><h2>{t.quickSettings}</h2><p>{t.quickDescription}</p><div className="feature-chips"><span>{t.sixStages}</span><span>{t.pollingOptions}</span><span>{t.lodOptions}</span></div><button className="primary-button" onClick={goToPerformance}>{t.openPerformance}<ChevronRight size={16} aria-hidden="true"/></button></div><MouseVisual /></div>
    <div className="section-heading"><div><h2>{t.deviceStatus}</h2><p>{t.notReadDescription}</p></div><span className="state-tag"><Unplug size={14} aria-hidden="true"/>{t.unknown}</span></div>
    <div className="status-grid">
      <article className="status-card"><span className="card-icon"><Usb size={19} aria-hidden="true"/></span><div><strong>{t.identifiedModel}</strong><p>{t.modelDescription}</p></div></article>
      <article className="status-card"><span className="card-icon"><Activity size={19} aria-hidden="true"/></span><div><strong>{t.protocol}</strong><p>{t.protocolDescription}</p></div></article>
    </div>
  </section>;
}

function Performance({ t }: { t: Messages }) {
  return <Workspace language={t.performance === 'Desempenho' ? 'pt-BR' : 'en'} page="performance"/>;
}

function Settings({ t, prefs, startup, busy, ready, onChange, onToggleStartup }: { t: Messages; prefs: Preferences; startup: boolean; busy: boolean; ready: boolean; onChange: (preferences: Preferences) => void; onToggleStartup: () => void }) {
  return <section className="content page-enter" aria-labelledby="settings-title"><div className="page-heading"><div><p className="kicker">{t.studio}</p><h1 id="settings-title">{t.preferencesTitle}</h1><p className="lede">{t.preferencesDescription}</p></div></div>
    <div className="settings-card"><SettingRow title={t.language} description={t.languageDescription}><select aria-label={t.language} disabled={busy || !ready} value={prefs.language} onChange={event => onChange({...prefs,language:event.target.value as Language})}><option value="pt-BR">Português (Brasil)</option><option value="en">English</option></select></SettingRow><SettingRow title={t.appearance} description={t.appearanceDescription}><select aria-label={t.appearance} disabled={busy || !ready} value={prefs.theme} onChange={event => onChange({...prefs,theme:event.target.value as Preferences['theme']})}><option value="system">{t.system}</option><option value="light">{t.light}</option><option value="dark">{t.dark}</option></select></SettingRow></div>
    <h2 className="group-title">{t.windows}</h2><div className="settings-card"><SettingRow title={t.startup} description={isTauri() ? t.startupDescription : t.startupUnavailable}><Toggle label={t.startup} checked={startup} disabled={busy || !ready || !isTauri()} onChange={onToggleStartup}/></SettingRow><SettingRow title={t.close} description={t.closeDescription}><select aria-label={t.close} disabled={busy || !ready} value={prefs.closeAction} onChange={event => onChange({...prefs,closeAction:event.target.value as Preferences['closeAction']})}><option value="exit">{t.closeExit}</option><option value="tray">{t.closeTray}</option></select></SettingRow></div>{busy && <p className="save-status" role="status">{t.saving}</p>}
  </section>;
}

function EmptyPage({ page, t }: { page: Page; t: Messages }) {
  if (page === 'profiles') return <Workspace language={t.performance === 'Desempenho' ? 'pt-BR' : 'en'} page="profiles"/>;
  const Icon = pageIcons[page]; const descriptions = { buttons: t.buttonsDescription, macros: t.macrosDescription, profiles: t.profilesDescription } as const;
  return <section className="content page-enter" aria-labelledby="empty-title"><div className="page-heading"><div><p className="kicker">{t.deviceControl}</p><h1 id="empty-title">{t[page]}</h1><p className="lede">{descriptions[page as keyof typeof descriptions]}</p></div></div><div className="empty-state"><span><Icon size={24} aria-hidden="true"/></span><h2>{t.coming}</h2><p>{t.comingDescription}</p><div className="safety-note"><LockKeyhole size={14} aria-hidden="true"/>{t.previewHint}</div></div></section>;
}

export default function App() {
  const [prefs, setPrefs] = useState<Preferences>(defaultPreferences); const [page, setPage] = useState<Page>('overview');
  const [startup, setStartup] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [ready, setReady] = useState(!isTauri());
  const [deviceStatus, setDeviceStatus] = useState<'unknown' | 'detected' | 'absent' | 'error'>('unknown');
  const t = messages[prefs.language];
  useEffect(() => { if (!isTauri()) return; Promise.all([invoke<Preferences>('get_preferences'),isEnabled()]).then(([saved,enabled])=>{setPrefs(saved);setStartup(enabled)}).catch(()=>setError(messages['pt-BR'].readError)).finally(()=>setReady(true)); }, []);
  useEffect(() => { if (!isTauri()) return; let active = true; const check = () => invoke<{present:boolean}>('detect_device').then(result => { if (active) setDeviceStatus(result.present ? 'detected' : 'absent'); }).catch(() => { if (active) setDeviceStatus('error'); }); check(); const timer = window.setInterval(check, 10000); return () => { active = false; window.clearInterval(timer); }; }, []);
  useEffect(() => { document.documentElement.lang=prefs.language; document.documentElement.dataset.theme=prefs.theme; }, [prefs.language,prefs.theme]);
  const change = async (next: Preferences) => { if (busy) return; setError(''); setBusy(true); try { if (isTauri()) await invoke('save_preferences',{preferences:next}); setPrefs(next); } catch { setError(t.error); } finally { setBusy(false); } };
  const toggleStartup = async () => { if (busy || !isTauri()) return; setError(''); setBusy(true); try { if(startup) await disable(); else await enable(); setStartup(await isEnabled()); } catch { setError(t.startupError); } finally { setBusy(false); } };
  const pages: Page[] = ['overview','performance','buttons','macros','profiles','settings'];
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brandmark">X<span>3</span></div><div><strong>Attack Shark</strong><small>Studio</small></div></div><nav aria-label={t.navLabel}>{pages.map(item=>{const Icon=pageIcons[item];return <button key={item} className={`nav-item ${page===item?'active':''}`} aria-current={page===item?'page':undefined} onClick={()=>setPage(item)}><Icon size={18} strokeWidth={1.75} aria-hidden="true"/><span>{t[item]}</span>{page===item&&<CircleDot className="nav-marker" size={12} aria-hidden="true"/>}</button>})}</nav><div className="side-bottom"><div className="device-mini"><span className="device-symbol"><Bluetooth size={16} aria-hidden="true"/></span><div><strong>Attack Shark X3</strong><small>{t.notRead}</small></div></div><small>{t.version}</small></div></aside>
    <main className="main" id="main-content"><header className="topbar"><div className="crumb"><span>{t.studio}</span><ChevronRight size={13} aria-hidden="true"/><strong>{t[page]}</strong></div><div className="top-actions"><span className="status-pill" role="status" title={deviceStatus==='detected'?t.detectionDetail:undefined}><i/><span>{deviceStatus==='detected'?t.detected:deviceStatus==='absent'?t.absent:deviceStatus==='error'?t.detectionError:t.unknown}</span></span><label className="language-switch"><Languages size={15} aria-hidden="true"/><span className="sr-only">{t.languageLabel}</span><select disabled={busy||!ready} value={prefs.language} onChange={event=>change({...prefs,language:event.target.value as Language})}><option value="pt-BR">PT-BR</option><option value="en">EN</option></select></label></div></header>{error&&<div className="error" role="alert">{error}</div>}{page==='overview'?<Overview t={t} goToPerformance={()=>setPage('performance')}/>:page==='performance'?<Performance t={t}/>:page==='settings'?<Settings t={t} prefs={prefs} startup={startup} busy={busy} ready={ready} onChange={change} onToggleStartup={toggleStartup}/>:<EmptyPage page={page} t={t}/>}</main>
  </div>;
}
