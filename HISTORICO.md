# Novidades da prévia 16

Abra **Minha coleção** no menu lateral ou use o atalho na tela inicial.

- **Encontre pelo verso** pesquisa as letras LRC locais, as letras editadas e as letras online já salvas. A busca ignora diferenças de acentuação e maiúsculas. Clique no resultado para tocar no timestamp do verso. Exibe até 100 resultados por consulta.
- **Momentos favoritos** guarda a posição atual da música com um nome escolhido por você. Use o coração no rodapé ou o botão na tela Minha coleção. Os momentos permanecem no perfil do aplicativo e no backup. Remover um momento apaga apenas o marcador.
- **Cápsula do mês** mostra tempo ouvido, quantidade de músicas, principais artistas e até 30 faixas mais ouvidas. Escolha o mês e salve a seleção como playlist. Salvar novamente atualiza a playlist gerada para aquele mês. A contagem usa os meses já registrados pelo aplicativo, sem estimar dados antigos ausentes.

A versão é **0.9.0-preview.16**. Os arquivos para Windows x64 seguem os nomes MATTOZ-Portable-0.9.0-preview.16-x64.exe e MATTOZ-Setup-0.9.0-preview.16-x64.exe. O canal de atualização online continua dependendo de publicação.

Os testes automatizados e os cenários de interface foram executados no Linux com Electron. A execução nativa no Windows requer sua validação.

---

# MATTOZ Music Player · 0.9.0-preview.15

No Windows x64, abra **MATTOZ-Portable-0.9.0-preview.15-x64.exe** para tocar sem instalar. Para adicionar os atalhos ao menu Iniciar, use **MATTOZ-Setup-0.9.0-preview.15-x64.exe**. O perfil e a biblioteca ficam nos dados do usuário do Windows. Os MP3s continuam nos caminhos importados.

- Em **Configurações → Transição entre músicas**, escolha de 1 a 5 segundos de crossfade. A opção começa desativada. Pausar congela a mistura e buscar encerra a sobreposição.
- Para gravações ao vivo, abra um álbum e escolha **Ouvir álbum sem intervalos**. O player decodifica a faixa atual e prepara a próxima, usando o mesmo relógio de áudio. Silêncio gravado no MP3 faz parte da música. Se o preparo não terminar a tempo, a próxima faixa começa assim que estiver disponível. Faixas acima de 15 minutos ou do limite de decodificação de 32 MB usam reprodução convencional.
- Na tela cheia, **Escolher animação** aceita GIF, MP4 e WebM. Ative as capas animadas nas configurações. O vídeo toca em loop, sem som.
- O menu Iniciar inclui **MATTOZ Launcher**. A consulta de versões depende de um canal HTTPS publicado pelo mantenedor. A opção portátil também aceita o argumento `--launcher`.

Para desenvolver no PowerShell, execute `npm.cmd ci` e `npm.cmd start` na pasta do projeto. Para compilar os dois executáveis, execute `npm.cmd run dist:win`. A compilação verifica o CRC interno dos dois arquivos e gera `dist/release.json` com as assinaturas SHA-256 para conferência.

Para publicar versões, defina a URL HTTPS de `release.json` em `src/main/release-feed.json` antes da compilação. Hospede o manifesto e os dois executáveis no mesmo diretório. O launcher abre o download escolhido no navegador após um clique.

**Validação** — `npm.cmd test` e `npm.cmd run check`. Com FFmpeg disponível no PATH, `electron scripts/test-electron.cjs` executa o cenário de dois MP3s com perfil temporário, letras locais, equalizador, pausa, busca e transição de álbum. O histórico abaixo documenta as fases anteriores.

---

# MATTOZ MUSIC PLAYER 0.8.0

Player local de MP3 para Windows x64: biblioteca, playlists, singles, letras LRC, tela imersiva com vinil, mini player, estatísticas e backup.

Para abrir pelo código-fonte: `npm.cmd ci` e `npm.cmd start` (Node 24 recomendado).
Para gerar instalador: `npm.cmd run dist:win`.

Leia FASE-8.md para mudanças, auditoria e limites de validação. Os guias FASE-7.md e SINGLES-E-VINIL-0.7.2.md detalham os recursos anteriores.
