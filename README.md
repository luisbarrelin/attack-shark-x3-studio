# Attack Shark X3 Studio — código inicial

Projeto Windows Tauri 2, React, TypeScript, Vite e Tailwind. É uma primeira etapa de desenvolvimento, não um configurador funcional do mouse. O transporte HID e todas as funções de configuração do dispositivo ainda precisam ser implementados e validados.

O código inclui troca imediata entre português brasileiro e inglês, temas claro/escuro/sistema, configuração de inicialização com o Windows via plugin oficial do Tauri, e a opção de encerrar ou ocultar a janela na área de notificação. O menu da área de notificação possui abrir e encerrar, traduzidos. A inicialização usa `--minimized`, com janela inicialmente oculta. O aplicativo não habilita inicialização automática por conta própria; a escolha ocorre nas preferências.

**Estado de verificação:** este projeto ainda não foi compilado nem executado: Rust, C++ Build Tools e dependências de frontend não foram instalados. Os comportamentos do tray e do registro de inicialização precisam de teste real no Windows antes de afirmar que funcionam. O código não faz acesso ao mouse.

## Para preparar um ambiente de desenvolvimento

Depois de autorizar e instalar os pré-requisitos oficiais do Tauri para Windows (Rust estável, ferramentas C++ MSVC e WebView2, se necessário), execute `npm install` e `npm run tauri dev` na pasta deste projeto. A criação do instalador usa `npm run tauri build`. O gerenciador npm já existe nesta máquina, instalado anteriormente com o REA. O plugin de inicialização exige Rust 1.90 ou superior.

Referências: https://v2.tauri.app/start/prerequisites/ e https://v2.tauri.app/plugin/autostart/.

## Escopo futuro

- Recuperar leitura de estado/ack e validar preservação dos demais campos antes de oferecer escrita HID.
- Reproduzir DPI, polling, botões, macros, perfis, bateria e energia conforme a auditoria técnica.
- Completar testes de acessibilidade, idiomas, inicialização, tray, atualização e desconexão.
- Integrar componentes shadcn/ui quando houver ambiente de dependências disponível.
