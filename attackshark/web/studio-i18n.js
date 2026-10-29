/* Studio UI labels. Protocol identifiers and user-authored names are never translated. */
'use strict';
window.StudioI18n = (() => {
  const pt = {
    'Dashboard':'Visão geral','Profiles':'Perfis','Tools':'Ferramentas','Themes':'Temas',
    'DPI stages':'Estágios de DPI','Colour':'Cor','Active':'Ativo','Add stage':'Adicionar estágio','Remove stage':'Remover estágio',
    'Polling rate':'Taxa de leitura','Sensor':'Sensor','Lift-off distance':'Distância de levantamento (LOD)',
    'Motion sync':'Sincronização de movimento','Ripple control':'Controle de ondulação','Angle snap':'Correção de trajetória',
    'Power & response':'Energia e resposta','Sleep':'Suspensão','Deep sleep':'Suspensão profunda','Key response':'Tempo de debounce',
    'Backup and reset':'Backup e restauração','Export backup…':'Exportar backup…','Restore backup…':'Restaurar backup…',
    'Push everything':'Aplicar todas as configurações','Factory reset':'Restaurar padrões de fábrica',
    'A backup holds the settings, macros, per-app profiles and saved test runs in one file.':'O backup reúne configurações, macros, perfis por aplicativo e resultados salvos em um único arquivo.',
    'The mouse answers no reads, so settings are pushed to it, never read back. Everything here is sent once when the app starts.':'As configurações são enviadas ao mouse, sem leitura de retorno. Ao iniciar, o aplicativo envia a configuração local completa.',
    'New macro':'Nova macro','Button bindings':'Atribuições dos botões',
    'key-only macros run on the mouse itself; anything with movement runs from this app':'Macros somente de teclas executam no mouse; macros com movimento dependem deste aplicativo.',
    'Button':'Botão','Preset':'Ação predefinida','Keyboard shortcut':'Atalho de teclado',
    'Click the field, then press the combination.':'Clique no campo e pressione a combinação desejada.',
    'press keys…':'pressione as teclas…','Cancel':'Cancelar','Assign':'Atribuir','Name':'Nome',
    'Repeat':'Repetição','Times':'Vezes','Speed':'Velocidade','Add lane':'Adicionar faixa',
    'Key':'Tecla','Mouse button':'Botão do mouse','Scroll wheel':'Roda de rolagem','Add':'Adicionar',
    'Pass':'Ciclo','Step':'Etapa','Detail':'Detalhes','Click':'Clique','Move':'Movimento','Wheel':'Rolagem','Delay':'Intervalo',
    'Use lanes':'Usar faixas','Record':'Gravar','Save':'Salvar','Delete':'Excluir','Edit':'Editar',
    'Profile':'Perfil','Programs':'Programas','Settings while it is in front':'Configurações enquanto o aplicativo está em primeiro plano',
    'Only ticked settings change. The DPI replaces whichever stage is active.':'Apenas as configurações marcadas são alteradas. O DPI substitui o valor do estágio ativo.',
    'Use its own button bindings':'Usar atribuições de botões próprias','Per-app profiles':'Perfis por aplicativo',
    'New profile':'Novo perfil','Particles':'Partículas','Appearance':'Aparência','Theme':'Tema',
    'off':'Desativado','on':'Ativado','none':'Nenhum','once':'Uma vez','hold':'Enquanto pressionado','toggle':'Alternar',
    'Start':'Iniciar','Stop':'Parar','Refresh':'Atualizar','Apply':'Aplicar','Link':'Conexão','Clicks':'Cliques','Aim':'Mira',
    'Report rate':'Frequência dos relatórios','Saved runs':'Resultados salvos','No runs yet.':'Nenhum resultado salvo.',
    'Clear all':'Limpar tudo','When':'Data','Rate':'Frequência','Lost':'Perdidos','Late':'Atrasados',
    'Gap between reports':'Intervalo entre relatórios','Receiver placement':'Posicionamento do receptor','USB port':'Porta USB',
    'DPI accuracy':'Precisão do DPI','Distance':'Distância','Run':'Execução','Stage DPI':'DPI do estágio',
    'Measured':'Medido','Error':'Erro','Off straight':'Desvio da trajetória','Click timing':'Tempos de clique',
    'Presses':'Acionamentos','Hold min':'Pressão mínima','Hold med.':'Pressão mediana','Gap min':'Intervalo mínimo','Chatter':'Cliques espúrios',
    'times in milliseconds':'Tempos em milissegundos','Notches I scrolled':'Passos de rolagem realizados',
    'Sensitivity':'Sensibilidade','New DPI':'Novo DPI','Target cm/360':'Meta em cm/360°','Check again':'Verificar novamente',
    'left click':'Clique esquerdo','right click':'Clique direito','middle click':'Clique do meio',
    'not connected':'Não conectado','connecting…':'Conectando…','read from the mouse, not the vendor app':'Estado recebido do mouse; a porcentagem da bateria é uma estimativa.',
    'Read-only preview':'Prévia somente de leitura',
    'Settings are stored locally, not read back from the mouse. A saved configuration is reapplied at startup. On first launch, no default configuration is sent automatically.':'As configurações são armazenadas localmente, sem leitura de retorno do mouse. Um perfil salvo é reaplicado ao iniciar. Na primeira execução, nenhum padrão é enviado automaticamente.',
    'left_click':'Clique esquerdo','right_click':'Clique direito','middle_click':'Clique do meio','forward':'Avançar','backward':'Voltar',
  };
  let language;
  try { language = localStorage.getItem('x3-studio-language') || 'pt-BR'; } catch (_) { language = 'pt-BR'; }
  if (!['pt-BR','en'].includes(language)) language = 'pt-BR';
  const normalize = text => String(text).trim().replace(/\s+/g,' ');
  const t = text => language === 'pt-BR' && typeof text === 'string' ? (pt[normalize(text)] || text) : text;
  const staticText = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while(walker.nextNode()) {
    const node=walker.currentNode;
    if(!node.parentElement.closest('script,style') && pt[normalize(node.textContent)]) staticText.push([node,node.textContent]);
  }
  const attrs = [];
  for(const element of document.querySelectorAll('[title],[placeholder],[aria-label]')) {
    for(const name of ['title','placeholder','aria-label']) {
      const value=element.getAttribute(name); if(value && pt[normalize(value)]) attrs.push([element,name,value]);
    }
  }
  const pick=document.createElement('select');pick.id='studio-language';pick.setAttribute('aria-label','Idioma / Language');
  for(const [value,label] of [['pt-BR','Português (Brasil)'],['en','English']]) { const option=document.createElement('option');option.value=value;option.textContent=label;pick.append(option); }
  document.querySelector('.top').append(pick);
  function setLanguage(next) {
    language=next;document.documentElement.lang=next;pick.value=next;
    try {localStorage.setItem('x3-studio-language',next);}catch(_){}
    for(const [node,source] of staticText)node.textContent=t(source);
    for(const [element,name,source] of attrs)element.setAttribute(name,t(source));
    if(window.S && window.render)window.render(window.S);
    for(const element of document.querySelectorAll('[data-studio-label]'))element.textContent=t(element.dataset.studioLabel);
  }
  pick.onchange=()=>{
    setLanguage(pick.value);
    fetch('/api/studio/preferences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({language:pick.value})}).catch(()=>{});
  };
  setLanguage(language);
  const stageHint=(count,dpi)=>language==='pt-BR'?`${count} de ${dpi.slots} estágios · ${dpi.min}–${dpi.max} em passos de ${dpi.step}`:`${count} of ${dpi.slots} stages · ${dpi.min}–${dpi.max} in steps of ${dpi.step}`;
  return {t,setLanguage,stageHint,known:text=>typeof text==='string' && !!pt[normalize(text)]};
})();
