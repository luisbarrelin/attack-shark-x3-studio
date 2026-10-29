# Origem e licença

Esta versão utiliza o projeto MIT de **prodmutant**, preservando seu código, interface e recursos:

- Origem: https://github.com/prodmutant/Attack-Shark-X3
- Commit de referência: `e26a7fb9da12d8a5f116a03bfb8f8be87e16472b`
- Copyright (c) 2026 prodmutant
- A licença integral permanece em `LICENSE`; o README original está em `README.upstream.md`.

Adaptações do Studio: identidade do aplicativo, nome próprio para estado/mutex/inicialização, inicialização minimizada, tradução dos controles principais, primeira execução sem envio automático de defaults e prévia somente para leitura usada na revisão visual.

O executável fornecido pelo usuário foi identificado estaticamente como PE x64, SHA-256 `64702779b413622e84d755d266951b16372b50567fa1ec63934358c62ac71f34`. Não foi executado nem usado como base binária; não foi comprovada correspondência exata entre esse arquivo e o commit acima. O novo executável é compilado do código-fonte publicado neste repositório.

Os arquivos anteriores em `src/` e `src-tauri/` são a implementação Tauri histórica 0.2.0. A versão baseada no projeto solicitado é o pacote Python `attackshark/` e o ponto de entrada `launch_studio.py`.
