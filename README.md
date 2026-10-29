# Attack Shark X3 Studio — base prodmutant

Versão `1.2.0+studio.1`, baseada diretamente no projeto [prodmutant/Attack-Shark-X3](https://github.com/prodmutant/Attack-Shark-X3), commit `e26a7fb9da12d8a5f116a03bfb8f8be87e16472b`, sob licença MIT. Os créditos e a licença do autor foram preservados. Veja [NOTICE.md](NOTICE.md) e [README.upstream.md](README.upstream.md).

Esta é a implementação principal solicitada pelo usuário. Os diretórios `src/` e `src-tauri/` mantêm a versão Tauri 0.2.0 anterior para consulta; não fazem parte deste executável Python.

## Executar no Windows

Baixe `AttackSharkX3Studio.exe` na seção Releases. É um executável portátil com o Python e a interface incorporados; não precisa instalar Python nem um driver de kernel. Ele permanece na área de notificação e abre a interface no navegador padrão. Fechar a aba mantém o aplicativo em execução; use **Encerrar** no menu do ícone para sair completamente.

O menu da área de notificação permite escolher **Iniciar com o Windows**. A inicialização automática usa `--minimized` e não abre a interface. A instalação não habilita essa opção por conta própria.

A interface mantém layout, temas, desenho do mouse, editor de macros e ferramentas da referência. Há troca imediata entre português brasileiro e inglês para a navegação, controles principais, perfis e editor. Diagnósticos avançados e mensagens herdadas ainda podem aparecer em inglês; a localização não deve ser tratada como integral.

## Recursos herdados da base

- DPI em até oito estágios, estágio ativo, cores, taxa de leitura, LOD e opções de sensor.
- Temporizadores de suspensão e suspensão profunda e tempo de debounce.
- Atribuição dos cinco botões, ações multimídia/navegador e atalhos de teclado.
- Macros de teclas no firmware e macros executadas no computador, com editor de linha do tempo.
- Perfis por aplicativo, backup/restauração, temas e ferramentas de diagnóstico.

O protocolo, a lógica e os recursos foram reutilizados do código MIT, não reimplementados apenas pela aparência. A disponibilidade de uma função no código não substitui validação em cada revisão de firmware. A bateria é uma estimativa com limitações conhecidas, descritas em [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

## Estado local e primeira execução

O estado deste Studio fica em `%APPDATA%\attackshark-x3-studio.json`, separado do arquivo da referência e da biblioteca Tauri anterior. Backups entre os dois formatos do Studio não são intercambiáveis.

O mouse não fornece leitura completa das configurações nesta implementação. Os valores iniciais vêm da base e não devem ser confundidos com o estado atual do seu mouse. Na primeira execução, sem arquivo local salvo, a configuração completa não é enviada automaticamente. Ajustes feitos na interface são enviados ao dispositivo. Depois que existe um estado salvo, ele é reaplicado ao iniciar, seguindo a estratégia da referência.

Não execute simultaneamente este programa, o aplicativo original do fabricante e o PRODMUTANT Driver: todos podem escrever no mesmo dispositivo.

## Driver opcional

O código do filtro de kernel da referência está preservado em `driver/` para manter a procedência e os testes de contrato. Ele **não é compilado, instalado ou habilitado** por `build_studio.py`. Nenhuma alteração em Secure Boot, assinatura de testes ou permissões do Windows foi realizada. O aplicativo usa as alternativas de espaço de usuário quando o filtro não está instalado. Consulte as limitações do autor em [docs/DRIVER.md](docs/DRIVER.md).

## Verificação desta entrega

As sete suítes offline da referência passaram: protocolo, estado, origem HTTP, perfis, linha do tempo, cálculos de diagnóstico e contrato do driver. O teste do protocolo reproduziu 58 de 60 pacotes capturados; os dois restantes são explicitamente ignorados pela suíte original. Os testes não instalaram o driver nem executaram macros no mouse. A interface foi revisada em modo de prévia somente de leitura. Não houve novos testes de escrita no hardware, conforme solicitado pelo usuário.

O executável fornecido pelo usuário não foi executado nem simplesmente reempacotado. O novo binário é produzido do código-fonte deste repositório. Não se alega identidade binária com o `.exe` fornecido.

## Compilar

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install pyinstaller==6.22.3
.\.venv\Scripts\python.exe build_studio.py
```

Saída: `dist/AttackSharkX3Studio.exe`. O script incorpora interface, licença e créditos e não executa o aplicativo nem instala drivers. Para usar o código sem compilar: `python -m attackshark tray`.

Para revisar apenas a interface, sem monitor, macros, sincronização ou escrita HID:

```powershell
python -c "from attackshark.server import serve; serve(port=7343,open_browser=False,preview=True)"
```

A prévia usa `http://127.0.0.1:7343/` e rejeita operações de escrita da API.
