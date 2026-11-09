# Prévia 16 — Coleção pessoal

Busca nas letras salvas com resultados clicáveis, marcadores de momentos e cápsula mensal com geração de playlist. Nova tela Minha coleção, atalho no Início e coração no rodapé. Dados incluídos no backup local. 64 testes automatizados passaram. Cenário no Electron verificou salvar e tocar o marcador, tocar o timestamp encontrado na busca e gerar a playlist mensal pela interface.

---

# Estado da prévia 15

Esta revisão substitui os apontamentos históricos abaixo sobre áudio, capas, launcher e distribuição. O modo normal usa dois elementos de mídia para crossfade. O modo **Ouvir álbum sem intervalos** usa duas faixas decodificadas com início agendado no mesmo AudioContext. Os controles e o leitor consultam o tempo da faixa ativa.

O cenário no Electron com dois MP3s confirmou sobreposição, pausa, retomada, busca, equalizador ativado, mudança de letra LRC e intervalo programado de zero amostras. O teste usa um perfil temporário no Linux. A escuta física, a execução dos dois .exe, a bandeja e os atalhos no Windows requerem validação nativa.

O launcher opcional oferece consulta de versões por manifesto HTTPS. A URL está vazia até o mantenedor publicar o canal. O instalador e o portátil são compilados com verificação de integridade NSIS obrigatória. As instruções estão no README.

---

# Fase 9 — trabalho parcial
Implementado nesta prévia: busca global sobre a tela atual, usando Ctrl+K, com músicas, artistas, álbuns e playlists.
Ainda pendentes: modo álbum; encartes; crossfade/gapless; importação por arrastar e soltar; monitoramento de pastas; capas animadas; temas salvos; cartão de compartilhamento; integração Windows; equalizador; editor de informações; playlists inteligentes; tela cheia configurável; páginas de artistas/álbuns; seleção múltipla na fila; temporizador avançado; launcher.
Esta prévia não é a Fase 9 concluída e não inclui instalador. A versão da base permanece 0.8.1 até a conclusão da integração.

Prévia 2: vinil interativo implementado, com captura de ponteiro, 30 segundos por volta, busca limitada a cada 60 ms durante o gesto e aplicação final ao soltar. Preserva estado pausado/reproduzindo. Controle por setas e Home/End. Testes matemáticos de limites e passagem de ângulo; validação visual no Windows ainda pendente. Demais itens continuam pendentes.

Prévia 3: temas salvos em Configurações (fundo, destaque, tamanho das letras e movimento), persistidos no banco local e incluídos no backup; temporizador com redução opcional de volume nos últimos 10 segundos e parada ao final da faixa. 33 testes automatizados passaram. O temporizador usa tempo de relógio mesmo com a reprodução pausada e não persiste após fechar o app. Alterar o volume manualmente cancela o temporizador. Fontes personalizadas e demais funções ainda pendentes. Sem novo instalador nesta prévia.


## Prévia 4 — biblioteca e playlists automáticas

- Biblioteca > Detalhes > Editar informações: título, artista, álbum, ano e capa local. As alterações ficam no banco do MATTOZ; os MP3s permanecem intactos. As correções sobrevivem à reimportação.
- Playlists automáticas: Favoritas; Adicionadas recentemente (30 dias); Mais ouvidas (50 faixas por tempo ouvido); Redescobrir (ouvidas antes e sem reprodução há 30 dias). Atualizadas ao abrir ou pelo botão Atualizar; podem gerar cópias editáveis.
- Datas de importação começam a ser registradas nesta prévia. Músicas antigas entram nessa contagem na primeira reimportação. Histórico antigo sem data de última reprodução não é inferido.
- Alterações de metadados aparecem na biblioteca imediatamente e no player ao carregar novamente a faixa.
- Validação: 36 testes automatizados aprovados e verificação de sintaxe aprovada. Sem teste nativo no Windows nesta etapa.
- Continua sendo código-fonte de desenvolvimento, não a Fase 9 completa nem um novo instalador. Recursos restantes da lista original continuam pendentes.


## Prévia 5 — ouvir o álbum e encarte digital

- Álbuns > escolher álbum: capa, artista, duração, faixas ordenadas por disco/número e destaque da faixa carregada. Ouvir álbum substitui a fila, desativa aleatório/repetição e respeita a ordem do disco. Os controles continuam disponíveis.
- Lados A/B virtuais: divisão aproximada pela duração de cada disco, explicitamente identificada como virtual. Não são dados da edição física.
- Encarte por artista do álbum + título: créditos, contracapa, até 8 fotos PNG/JPEG de 3 MB e um PDF de 12 MB. Cópias ficam no banco e entram no backup. Renomear álbum/artista do álbum muda a associação do encarte; não há migração automática nesta prévia.
- PDF pode ser exportado para leitura externa; não há leitor PDF embutido.
- 40 testes passaram, incluindo ordem de reprodução, destaque da faixa, anexos, exportação, persistência e testes existentes de áudio/LRC. Não houve execução nativa no Windows.
- Distribuição continua sendo código-fonte, sem novo instalador. Fase 9 completa ainda em desenvolvimento.


## Prévia 6 — personalização da tela cheia e cartão da música

- Tela cheia > Personalizar: capa com vinil, capa em destaque ou capa com três versos (anterior/atual/próximo), fundo neutro ou cor do álbum, brilho do fundo de 25–100% e tamanho da capa de 65–100%. Preferências persistem no banco e no backup.
- O modo de versos espelha o leitor LRC existente; não altera timestamps ou posição do áudio. Não substitui o leitor completo de letras.
- Trocar de layout encerra arraste ativo no vinil com retomada conforme estado anterior.
- Criar cartão aparece na tela cheia e no painel Tocando agora: prévia e exportação PNG 1080 × 1080 com capa, título, artista, álbum e identidade MATTOZ. Usa a cor de destaque atual. Sem capa, usa a marca MATTOZ; textos extensos recebem reticências. O cartão captura a música do momento em que foi aberto.
- 44 testes aprovados; sintaxe verificada; PNG real gerado e inspecionado. O Chromium do ambiente estava indisponível para a verificação visual da janela; sem teste nativo no Windows.
- Continua sendo prévia em código-fonte, sem novo EXE. Permanecem pendentes, entre outros, equalizador, crossfade/gapless, importação por arrastar, monitoramento de pastas, capas animadas, controles Windows e launcher.


## Prévia 7 — arrastar arquivos e monitorar pastas

- Arraste MP3s ou pastas do Explorador de Arquivos para a janela. A importação percorre subpastas, lê metadados, mostra progresso e atualiza a biblioteca, preservando os arquivos originais. Arquivos já registrados não geram novas entradas.
- Configurações > Pastas monitoradas: escolher, pausar/retomar, parar de monitorar, verificar agora e selecionar os novos arquivos antes de importar. O cabeçalho mostra um botão quando existem músicas aguardando revisão.
- Verificação a cada 30 segundos enquanto o app está aberto; pastas escolhidas persistem no banco e entram no backup. Não há serviço em segundo plano com o app fechado.
- Arquivos precisam manter tamanho e data de alteração entre duas verificações separadas por pelo menos 2 segundos. Isso reduz, mas não elimina, o risco de importar uma cópia em andamento. Uma checagem final ocorre antes da importação confirmada.
- Limites: 10 pastas monitoradas; até 10.000 MP3s e 50.000 entradas por varredura. Links simbólicos não são percorridos. O monitoramento não exclui músicas nem altera automaticamente arquivos existentes.
- O botão preexistente Atualizar / buscar novas continua importando as pastas previamente adicionadas por Importar pasta; a revisão é aplicada às descobertas do novo monitoramento.
- 49 testes aprovados, incluindo arquivos reais, duplicatas, subpastas, estabilidade de cópias, pasta desconectada, revisão explícita e validação da origem da importação. Sintaxe verificada. Arraste nativo no Windows ainda não validado.
- Prévia cumulativa em código-fonte; sem novo instalador.


## Prévia 8 — fila, artistas e temas
- Seleção múltipla na fila: selecionar todas, limpar, remover e mover o conjunto para tocar a seguir. Remover preserva a faixa atual.
- Páginas de artistas exibem discografia local com capas, contagem de faixas e duração, com acesso à página de cada álbum. Separação explícita de singles ainda pendente.
- Quatro famílias de fonte do sistema, seletor de cor personalizado e temas salvos com essas opções. Cartões usam a cor personalizada. Não inclui instalação de fontes externas.
- Testes automatizados e sintaxe verificados; sem validação nativa no Windows. Continua sendo prévia de código-fonte. Equalizador, crossfade/gapless, capas animadas, integração Windows e launcher permanecem pendentes.


## Prévia 9 — equalizador experimental
- Configurações > Equalizador: três bandas (160 Hz, 1 kHz, 6 kHz), -12 a +12 dB, presets Neutro/Graves/Voz/Brilho/Suave e comparação com som original.
- Ajustes persistem; ativação manual a cada sessão. Compensação de ganho ao reforçar frequências e transição suave dos parâmetros.
- Usa o mesmo elemento de áudio; não muda currentTime, volume ou timestamps LRC. Comparação neutraliza filtros e ganho de compensação; o AudioContext permanece conectado até fechar o app.
- Protocolo de áudio autoriza CORS somente para mattoz://app para permitir processamento Web Audio.
- 52 testes automatizados aprovados. Testes do equalizador verificam controle/conexões com contexto simulado; não são validação acústica nem execução Electron no Windows. Essa validação permanece necessária.
- Sem novo instalador. Crossfade/gapless, capas animadas, integração Windows e launcher continuam pendentes.


## Prévia 10 — integração Windows
- Controles de anterior/reproduzir-pausar/próxima na miniatura da barra de tarefas, ligados aos controles existentes do player.
- Configurações > Integração com o Windows: continuar tocando na bandeja ao fechar (desativado por padrão). Clique no ícone para reabrir; menu inclui controles e Sair do MATTOZ. Preferência salva no banco.
- Ao sair explicitamente, a janela fecha normalmente. Se a bandeja não puder ser criada, o fechamento normal é preservado.
- 53 testes aprovados. Teste de integração usa simulações de janela/bandeja: ainda é necessário validar no Windows real. Sem novo EXE.


## Prévia 11 — capas animadas em GIF
- Tela cheia > Escolher GIF/Remover GIF. Configurações > Usar capas animadas na tela cheia (desativado por padrão).
- GIF copiado para a biblioteca, até 3 MB e 2048 × 2048. Capa original preservada; reimportação mantém a animação.
- Capa estática ao pausar, sair da tela cheia, ocultar o aplicativo ou usar movimento reduzido. Ao retomar, o GIF reinicia, sem sincronização de quadros com o áudio. Não há suporte a MP4/WebM nesta etapa.
- 55 testes aprovados. Validação GIF verifica assinatura, tamanho e dimensões; reprodução visual nativa ainda precisa de teste no Windows. Sem novo instalador.


## Prévia 12 — singles na discografia e boas-vindas
- Páginas de artistas separam singles marcados pelo usuário na seção Singles das demais faixas agrupadas por álbum. Não há classificação automática baseada em quantidade de faixas.
- Configurações > Launcher integrado: abrir tela de boas-vindas e optar por exibi-la a cada abertura. Novidades locais, entrar no player e abrir biblioteca. Não inicia áudio automaticamente.
- Launcher é uma tela dentro do aplicativo, não um executável separado. Consulta e instalação de atualizações continuam indisponíveis sem infraestrutura de publicação.
- 56 testes aprovados, incluindo abertura opcional e navegação do launcher. Sem teste nativo no Windows e sem novo EXE.
- Próximas pendências centrais: crossfade/gapless, validação real de áudio/interface/integração Windows e empacotamento.


## Prévia 13 — transição sequencial experimental
- Configurações > Transição sequencial: 1 a 5 segundos, desativada por padrão. Redução do volume no fim e entrada suave após a troca automática.
- Usa o tempo do elemento de áudio; pausa congela a progressão. Troca manual, busca na música e ajuste manual de volume cancelam a redução. Temporizador tem prioridade. Faixas muito curtas não recebem o efeito.
- Não é crossfade: não há sobreposição. Não é gapless: permanece o intervalo de carregamento entre faixas. Esses dois recursos continuam pendentes.
- 58 testes aprovados. O resultado acústico ainda não foi testado no Windows; permanece experimental. Sem novo instalador.


## Revisão 14 — auditoria e limites verificados
- Identificação corrigida para 0.9.0-preview.14 / Fase 9 em desenvolvimento. Ordenação da busca global corrigida para os campos reais disco/faixa. Verificação de sintaxe passa a incluir todos os arquivos JS/CJS.
- 58 testes automatizados aprovados. Electron 45.2.1 em modo headless Linux abriu a interface, importou o MP3 de teste, leu título e duração de 0,25 s e completou a reprodução sem erro de mídia. Isolamento de instância única foi substituído apenas no teste devido à restrição de sockets do ambiente. Sem dispositivo de saída de áudio: não houve avaliação acústica.
- Compilação de diagnóstico do estado anterior (ainda identificado como 0.8.1) concluída: 202245332 bytes, CRC NSIS 28aed01f. Esse instalador não é o lançamento final e não corresponde às correções desta revisão.
- Crossfade real, gapless e consulta/instalação online de atualizações NÃO foram implementados. Launcher continua integrado; endereço de publicação ainda ausente.
- Validação nativa Windows, versão portátil e instalador final ainda pendentes. Não considerar Fase 9 concluída.
