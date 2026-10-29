# Validação HID — estado atual

## Identificação

Em 29/10/2026, a enumeração de metadados do Windows encontrou um dispositivo `1D57:FA60`, versão de dispositivo `0x0112`, com uma coleção de configuração (`UsagePage 0x0B`, `Usage 0`, comprimento máximo de feature 262 bytes) e uma coleção de monitoramento (`UsagePage 0x0A`, `Usage 0`, input de 5 bytes). A enumeração abriu interfaces com acesso zero e não enviou relatórios. O PID `FA61` não apareceu na consulta feita no sandbox; suas interfaces não foram validadas nesta rodada.

## Leitura e confirmação

No disassembly do executável de SHA-256 `db7e366f06aa6b06e73cd3a76c7c4d02cf8927e0d9b80d6a838a179d4c52ab41`, as referências a `GetFeature` em `0x40edd2` e `0x40eee2` resolvem o endereço da função das DLLs e o armazenam em offsets `0x44` e `0x24`. Uma busca textual nos operandos do disassembly não encontrou uma leitura óbvia desses offsets como ponteiros de função. Essa busca é limitada: aliasing, acesso indireto e falhas de disassembly podem ocultar chamadas. Portanto, não comprova ausência de leitura e não estabelece que `GetFeature` devolva o perfil.

O caminho de envio do report comum usa `SetFeature`; o retorno da API, isoladamente, não confirma que o mouse aplicou ou persistiu a alteração. O ramo sem fio espera um estado de confirmação, mas seu significado e sua associação com cada comando ainda não foram validados.

### Tratamento do monitor identificado estaticamente

A DLL encaminha o report `03` de cinco bytes como dois inteiros little-endian: bytes 1–2 e 3–4. No executável, o evento `0x5010` ajusta o estado em `[objeto+0x3f8]` para 1 quando o byte baixo do valor é zero (`0x413384..0x413393`). O laço de envio sem fio verifica esse mesmo estado para interromper tentativas (`0x4136eb`, `0x413877`). Isso é uma ligação estática entre um evento e o laço de envio, não prova que o evento confirme um comando específico ou a persistência do estado. O decoder implementado é offline e não abre o dispositivo.

O carregador de `ms_1/pro.data` contém uma leitura inicial de `0x28464` bytes seguida de registros de `0x80e0` bytes (`0x415c90..0x415cd2`). Sem um arquivo real e comparação de gravação/leitura, o layout e a correspondência com o estado do mouse permanecem desconhecidos. O arquivo fornecido estava ausente; não é backup confirmado do dispositivo.

## Limites

O report 04 contém todos os estágios, cores e flags de sensor, não apenas um valor DPI. Não existe ainda backup completo verificado nem procedimento confirmado de restauração. O encoder Rust é puramente offline, sem transporte nem comando exposto à interface. Vetores de polling e um perfil de sensor são testados contra a reconstrução anterior, não contra o hardware.

Antes da escrita: estabelecer estado inicial completo ou uma estratégia de restauração independente, entender o monitor/ack, conferir conexão e firmware, e verificar o resultado por leitura independente. A autorização do usuário para testes controlados já foi concedida; a ausência de um caminho seguro é uma limitação técnica, não falta de autorização.

## Entrega 0.2.0

O usuário posteriormente pediu suspender testes no mouse e concluir o software. Foi implementado envio manual experimental dos reports 04 e 06. O primeiro usa um perfil completo explicitamente escolhido no Studio, sem alegar preservação de campos desconhecidos nem backup do estado atual. Não há envio automático de valores iniciais. O programa apresenta confirmação de substituição de todos os campos de sensor e distingue aceitação pelo Windows de confirmação do firmware. Não houve teste de escrita nem confirmação de persistência no dispositivo.

Perfis do Studio usam JSON próprio versionado, com oito slots completos e validação. Não são compatíveis com arquivos .data do fabricante. A validação e o teste de persistência são locais e não demonstram equivalência de hardware.
