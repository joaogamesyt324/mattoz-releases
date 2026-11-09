# MATTOZ 0.6.1 — Tocando agora e tela imersiva

Feche a versão antiga e extraia esta em outra pasta. Na pasta mattoz-music-player:

```powershell
npm.cmd ci
npm.cmd start
```

Biblioteca, playlists e preferências continuam no mesmo banco.
Na barra inferior, ▣ abre o painel Tocando agora e ⛶ abre a tela imersiva.
No painel: capa, nome, artista, verso atual e Expandir música.
Na tela imersiva: capa grande, título, artista, álbum/ano, verso e fundo derivado
de uma cor saturada da capa. Sem capa, aparece símbolo musical e fundo padrão.
A barra inferior mantém todos os controles existentes.
Tela cheia ⛶ ocupa a tela do Windows. Voltar ou Esc retorna à biblioteca.
Abrir letras sincronizadas sai da tela imersiva para o leitor completo.
Não há busca de fotos de artistas ou videoclipes; a arte vem dos arquivos locais.

Arquivos: src/renderer/now-playing.js, index.html, styles.css; comando explícito
window:fullscreen via preload e IPC validado. O motor de áudio não mudou.
A prévia usa a linha ativa do leitor LRC existente, sem relógio independente.

Validação: sintaxe passou e 20 testes Node passaram, incluindo autorização e tipo
do comando fullscreen. Os testes existentes verificam áudio, fila e LRC.
Não foi executado teste visual/sonoro nem fullscreen real no Windows neste ambiente.

Teste manual:
1. Toque música com capa; abra painel e tela imersiva. Confira metadados e capa.
2. Troque faixa, pause, ajuste volume e busque outro ponto. Não deve reiniciar
   a reprodução só por abrir ou fechar os modos.
3. Teste MP3 sem capa e com LRC ausente. Teste título longo.
4. Confira se a prévia acompanha o LRC durante reprodução e após seek.
5. Ative tela cheia, saia com Esc e depois com Voltar. Confira teclado e foco.
6. Reduza a janela: painel sobrepõe o conteúdo em janelas menores; pode ser fechado.
7. Abra letras pelo painel, pela tela imersiva e pela barra inferior.
