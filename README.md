# Attack Shark X3 Studio

Versão 0.2.0 — aplicativo Windows independente em desenvolvimento, com Tauri 2, React, TypeScript, Vite e Tailwind. Ainda não possui equivalência funcional completa com o aplicativo do fabricante.

## Implementado

- Interface em português brasileiro e inglês, com troca imediata.
- Temas claro, escuro e do Windows.
- Instância única, área de notificação com abrir/encerrar e opção de fechar para a área de notificação.
- Inicialização opcional com o Windows, minimizada (`--minimized`).
- Detecção das interfaces HID presentes com VID 1D57 e PID FA60/FA61.
- Encoder offline dos relatórios 04 (sensor/DPI) e 06 (taxa de leitura), e decoder do monitor 03.
- Biblioteca local de até 64 perfis: criação por duplicação, renomeação, exclusão, seleção, gravação atômica e importação/exportação por JSON do Studio.
- Edição dos oito slots de DPI, estágios habilitados, estágio ativo, cores RGB, LOD, Ripple Control, Angle Snap e Motion Sync. Os seis primeiros DPI do modelo inicial seguem os valores fornecidos pelo usuário; os demais campos são um modelo editável e não uma leitura de hardware.
- Envio manual experimental de DPI/sensor (report 04) e taxa de leitura (report 06). O pacote de sensor substitui todos os oito estágios, cores e flags de uma vez e exige reconhecimento explícito na interface. O backend valida atributos e capacidades da coleção, exige uma única candidata e serializa as operações. O sucesso da API do Windows não confirma aplicação ou persistência no dispositivo.

## Ainda pendente

- Recuperar o perfil completo atual do dispositivo e oferecer restauração verificada.
- Botões, macros, perfis, bateria, energia e debounce com equivalência completa.
- Confirmação e persistência dos comandos no firmware, compatibilidade entre revisões e reconexão.
- Revisão visual e de acessibilidade completa e testes finais do instalador.

Os perfis são salvos apenas quando o usuário solicita. Editar campos, selecionar um perfil e salvar no computador não envia nada ao mouse. O envio ocorre pelos botões específicos. O aplicativo não grava automaticamente defaults no mouse. Não há comando genérico de escrita exposto ao frontend.

## Verificação

A identificação USB FA60 foi observada no Windows. Seis testes locais de formatos, validação de biblioteca e persistência passaram, excluindo o teste de enumeração HID nesta rodada. A prévia web preservou o perfil após recarregar. O frontend e o executável foram compilados. Tentativas anteriores de leitura dos relatórios 04 e 06 retornaram timeout (erro Windows 121); nenhum estado completo do mouse foi recuperado. Não houve teste de escrita de configuração pelo Studio. A pedido do usuário, os testes no dispositivo foram suspensos. Não declarar a integração como validada no hardware.

## Compilação

Pré-requisitos: Rust estável (1.90+), ferramentas C++ MSVC e WebView2. Instale as dependências com `npm install`; execute `npm run dev` para prévia web ou `npx tauri dev` para desktop. Compile o executável com `npx tauri build --no-bundle` e o instalador com `npx tauri build`.

Veja `VALIDACAO-HID.md` para os limites da análise e `design-system/attack-shark-x3-studio/MASTER.md` para a direção visual.
