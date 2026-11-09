# MATTOZ 0.7.1 — Fase 7 ampliada

## Abrir
Extraia o ZIP. Na pasta mattoz-music-player: `npm.cmd ci` e `npm.cmd start`.
Use o mesmo usuário do Windows para reaproveitar o perfil das versões anteriores.

## Recursos e onde encontrar
- Buscar e descobrir (Ctrl+K): pesquisa de músicas, artistas, álbuns e playlists; curtidas; mixes locais; tocar a seguir; adicionar ao fim; temporizador.
- Player: coração, ícones SVG, restauração de música/posição/fila sem iniciar automaticamente. Sessão salva a cada 3 segundos e na pausa.
- Fila: arrastar, remover e salvar como playlist. Para remover a música atual, selecione outra primeiro. Alterar ordem reinicia o histórico do modo aleatório.
- Playlists: capa local PNG/JPG até 5 MB, duplicação, nome e descrição, pastas de um nível com filtro, seleção múltipla para remover, adicionar várias músicas e arrastar. Não apaga MP3s.
- Mini player: botão no topo. Usa a mesma janela e o mesmo áudio, compacta e sempre por cima. Expandir restaura o tamanho.
- Estúdio da coleção: selecione uma música para ver capa, escolher contracapa e salvar memórias. Notas e contracapa são associadas à faixa. Ouvir álbum ordena por disco e número de faixa.
- Editor LRC: cole versos, prepare, dê play e marque cada entrada. Edite os timestamps no campo de texto, salve no MATTOZ ou exporte LRC. A edição salva tem prioridade sobre a letra local; os arquivos originais não são alterados.
- Capas online: busca manual por álbum/artista em MusicBrainz, escolha do resultado e download do Cover Art Archive. Letras online continuam via LRCLIB. Nenhum streaming de músicas.
- Revisar biblioteca: possíveis duplicatas por título/artista/duração e localização manual de MP3s movidos. Atualize a biblioteca para detectar arquivos ausentes. Duplicatas não são apagadas automaticamente.
- Retrospectiva: tempo ouvido no mês, artista e até três músicas, exportáveis como PNG. Ranking mensal começa nesta versão; tempo diário anterior continua contado.
- Backup: exporta dados, playlists, letras, capas, histórico e preferências para JSON. Não inclui os MP3s. Restaurar pede confirmação e salva mattoz-antes-restauracao.json junto ao banco antes de substituir os dados. Caminhos de outro computador podem precisar de reparo.

## Limites e validação
27 testes automatizados aprovados: reprodução/fila, LRC, metadados, persistência, segurança IPC, contador, páginas com DOM simulado, sessão, playlists, backup e capas com serviço simulado. Não equivalem a teste visual ou reprodução real no Windows. Serviços online não foram validados ao vivo nesta entrega e podem retornar indisponibilidade.
Busca mostra até 200 faixas; mixes até 30. O temporizador depende do aplicativo aberto. Uma queda abrupta pode perder os últimos segundos de sessão e estatísticas. Mini player e instalador precisam ser testados no Windows.

## Gerar instalador no Windows
`npm.cmd run dist:win`
A saída fica em dist. O instalador é NSIS para Windows x64, sem certificado de assinatura digital. Configuração baseada em https://www.electron.build/v26/docs/nsis/ .

## Roteiro de aceitação para a Fase 8
1. Exportar backup; reproduzir, pausar, fechar, reabrir e conferir posição/fila.
2. Duplicar playlist; mudar capa/pasta; selecionar e remover duas faixas; conferir original intacta.
3. Mover faixas na fila e testar tocar a seguir, inclusive com aleatório.
4. Entrar e sair do mini player e da tela imersiva sem interromper áudio.
5. Marcar versos, salvar, buscar para frente/trás e conferir letra.
6. Criar memória/contracapa; reiniciar; exportar retrospectiva.
7. Restaurar backup; conferir curtidas/playlists; testar cancelamento.
8. Testar letras/capas online e mensagens sem conexão.

Compilação neste ambiente Linux: empacotamento Windows executado, mas o instalador não foi concluído por ausência de Wine. O ZIP contém fonte e configuração, não um EXE pronto. O workflow incluído deve ser colocado em um repositório com este projeto na raiz para executar via GitHub Actions.
