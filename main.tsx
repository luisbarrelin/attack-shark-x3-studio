import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { invoke, isTauri } from '@tauri-apps/api/core';
import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';
import './style.css';

type Preferences = { language: 'pt-BR' | 'en'; theme: 'system' | 'light' | 'dark'; closeAction: 'exit' | 'tray' };
type Page = 'overview' | 'performance' | 'buttons' | 'macros' | 'profiles' | 'settings';
const initial: Preferences = { language: 'pt-BR', theme: 'system', closeAction: 'exit' };
const messages = {
  'pt-BR': {
    overview:'Visão geral', performance:'Desempenho', buttons:'Botões', macros:'Macros', profiles:'Perfis', settings:'Preferências',
    eyebrow:'CONTROLE DO DISPOSITIVO', title:'Seu mouse, do seu jeito.', description:'Um espaço para ajustar cada detalhe do Attack Shark X3.',
    status:'Status do dispositivo', unknown:'Não verificado', unknownDescription:'A leitura e a configuração do mouse estão em desenvolvimento.',
    explore:'Seu espaço de controle', exploreDescription:'As funções do mouse serão disponibilizadas após a validação da comunicação com o dispositivo.',
    available:'Em desenvolvimento', preferencesTitle:'Preferências', preferencesDescription:'Personalize o Studio para funcionar do seu jeito.',
    general:'Geral', language:'Idioma', languageDescription:'Escolha o idioma da interface. A alteração é imediata.', appearance:'Aparência', appearanceDescription:'Defina como o Studio aparece para você.',
    system:'Usar configuração do Windows', light:'Claro', dark:'Escuro', windows:'Inicialização e janela', startup:'Iniciar com o Windows',
    startupDescription:'Abre o Studio na área de notificação quando você entra no Windows.', close:'Ao fechar a janela', closeDescription:'Escolha o que acontece ao clicar no botão de fechar.', closeExit:'Encerrar o aplicativo', closeTray:'Minimizar para a área de notificação',
    startupUnavailable:'A inicialização automática está disponível no aplicativo para Windows.', saving:'Salvando…', error:'Não foi possível salvar a preferência.', readError:'Não foi possível carregar as preferências.', startupError:'Não foi possível alterar a inicialização com o Windows.',
    coming:'Esta seção ainda está em desenvolvimento.', comingDescription:'A configuração ficará disponível quando os comportamentos do aplicativo original forem validados.', version:'Versão de desenvolvimento',
    languageLabel:'Alterar idioma', preview:'Prévia do Studio', previewDescription:'As alterações no dispositivo ainda não estão disponíveis.'
  },
  en: {
    overview:'Overview', performance:'Performance', buttons:'Buttons', macros:'Macros', profiles:'Profiles', settings:'Preferences',
    eyebrow:'DEVICE CONTROL', title:'Your mouse, your way.', description:'A place to fine-tune every detail of your Attack Shark X3.',
    status:'Device status', unknown:'Not checked', unknownDescription:'Device reading and configuration are under development.',
    explore:'Your control space', exploreDescription:'Mouse settings will be available after device communication has been validated.',
    available:'In development', preferencesTitle:'Preferences', preferencesDescription:'Make Studio work the way you do.',
    general:'General', language:'Language', languageDescription:'Choose the interface language. Changes apply immediately.', appearance:'Appearance', appearanceDescription:'Choose how Studio looks.',
    system:'Use Windows setting', light:'Light', dark:'Dark', windows:'Startup and window', startup:'Start with Windows',
    startupDescription:'Opens Studio in the notification area when you sign in to Windows.', close:'When closing the window', closeDescription:'Choose what happens when you click the close button.', closeExit:'Quit the application', closeTray:'Minimize to the notification area',
    startupUnavailable:'Automatic startup is available in the Windows app.', saving:'Saving…', error:'Could not save the preference.', readError:'Could not load preferences.', startupError:'Could not change the Windows startup setting.',
    coming:'This section is under development.', comingDescription:'Settings will be available once the original application’s behavior has been validated.', version:'Development version',
    languageLabel:'Change language', preview:'Studio preview', previewDescription:'Device changes are not available yet.'
  }
} as const;

function App() {
  const [prefs, setPrefs] = useState<Preferences>(initial);
  const [page, setPage] = useState<Page>('overview');
  const [startup, setStartup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(!isTauri());
  const t = messages[prefs.language];
  useEffect(() => {
    if (!isTauri()) return;
    Promise.all([invoke<Preferences>('get_preferences'), isEnabled()]).then(([p, enabled]) => { setPrefs(p); setStartup(enabled); }).catch(() => setError(messages['pt-BR'].readError)).finally(() => setReady(true));
  }, []);
  useEffect(() => { document.documentElement.lang = prefs.language; document.documentElement.dataset.theme = prefs.theme; }, [prefs.language, prefs.theme]);
  async function change(next: Preferences) {
    if (busy) return;
    setError(''); setBusy(true);
    try { if (isTauri()) await invoke('save_preferences', { preferences: next }); setPrefs(next); }
    catch { setError(t.error); } finally { setBusy(false); }
  }
  async function toggleStartup() {
    if (busy || !isTauri()) return;
    setError(''); setBusy(true);
    try { if (startup) await disable(); else await enable(); setStartup(await isEnabled()); }
    catch { setError(t.startupError); } finally { setBusy(false); }
  }
  const pages: Page[] = ['overview','performance','buttons','macros','profiles','settings'];
  const icons: Record<Page,string> = { overview:'◫',performance:'⌁',buttons:'◉',macros:'≡',profiles:'▤',settings:'⚙' };
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brandmark">X<span>3</span></div><div><strong>Attack Shark</strong><small>STUDIO</small></div></div>
      <div className="side-label">STUDIO</div><nav aria-label="Studio">{pages.map(item => <button key={item} className={'nav-item '+(page===item?'active':'')} onClick={() => setPage(item)}><span className="nav-icon" aria-hidden="true">{icons[item]}</span><span>{t[item]}</span>{page===item&&<span className="active-dot"/>}</button>)}</nav>
      <div className="side-bottom"><div className="small-device"><span className="small-status"/><div><strong>Attack Shark X3</strong><small>{t.unknown}</small></div></div><small>{t.version}</small></div>
    </aside>
    <main className="main"><header className="topbar"><div className="crumb">Studio <span>/</span> {t[page]}</div><div className="top-actions"><span className="status-pill"><i/> {t.unknown}</span><label className="language-switch"><span className="sr-only">{t.languageLabel}</span><select disabled={busy || !ready} value={prefs.language} onChange={e=>change({...prefs, language:e.target.value as Preferences['language']})}><option value="pt-BR">PT-BR</option><option value="en">EN</option></select></label></div></header>
    {error && <div className="error" role="alert">{error}</div>}
    {page==='overview' ? <section className="content"><div className="intro"><div><p className="eyebrow">{t.eyebrow}</p><h1>{t.title}</h1><p className="lede">{t.description}</p></div></div>
      <div className="hero"><div className="hero-copy"><div className="hero-label">ATTACK SHARK <span>X3</span></div><h2>{t.explore}</h2><p>{t.exploreDescription}</p><button className="ghost" onClick={()=>setPage('settings')}>{t.settings} <span aria-hidden="true">↗</span></button></div><div className="mouse-art" aria-hidden="true"><div className="mouse"><div className="mouse-seam"/><div className="wheel"/><div className="mouse-logo">X3</div></div><div className="mouse-shadow"/></div></div>
      <div className="section-title"><h2>{t.status}</h2><span>{t.available}</span></div><div className="status-card"><div className="status-icon">⌁</div><div><strong>{t.unknown}</strong><p>{t.unknownDescription}</p></div></div>
    </section> : page==='settings' ? <section className="content settings"><div className="page-heading"><p className="eyebrow">STUDIO</p><h1>{t.preferencesTitle}</h1><p className="lede">{t.preferencesDescription}</p></div>
      <h2 className="group-title">{t.general}</h2><div className="settings-card"><div className="setting-row"><div><strong>{t.language}</strong><p>{t.languageDescription}</p></div><select aria-label={t.language} disabled={busy || !ready} value={prefs.language} onChange={e=>change({...prefs,language:e.target.value as Preferences['language']})}><option value="pt-BR">Português (Brasil)</option><option value="en">English</option></select></div>
      <div className="setting-row"><div><strong>{t.appearance}</strong><p>{t.appearanceDescription}</p></div><select aria-label={t.appearance} disabled={busy || !ready} value={prefs.theme} onChange={e=>change({...prefs,theme:e.target.value as Preferences['theme']})}><option value="system">{t.system}</option><option value="light">{t.light}</option><option value="dark">{t.dark}</option></select></div></div>
      <h2 className="group-title">{t.windows}</h2><div className="settings-card"><div className="setting-row"><div><strong>{t.startup}</strong><p>{isTauri()?t.startupDescription:t.startupUnavailable}</p></div><button type="button" className={'switch '+(startup?'on':'')} role="switch" aria-label={t.startup} aria-checked={startup} disabled={busy || !ready || !isTauri()} onClick={toggleStartup}><span/></button></div>
      <div className="setting-row"><div><strong>{t.close}</strong><p>{t.closeDescription}</p></div><select aria-label={t.close} disabled={busy || !ready} value={prefs.closeAction} onChange={e=>change({...prefs,closeAction:e.target.value as Preferences['closeAction']})}><option value="exit">{t.closeExit}</option><option value="tray">{t.closeTray}</option></select></div></div>{busy&&<p className="save-status" role="status">{t.saving}</p>}
    </section> : <section className="content"><div className="page-heading"><p className="eyebrow">STUDIO</p><h1>{t[page]}</h1></div><div className="empty"><div className="empty-icon">⌁</div><h2>{t.coming}</h2><p>{t.comingDescription}</p></div></section>}
    </main></div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
