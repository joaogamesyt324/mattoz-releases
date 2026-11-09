# MATTOZ 0.6.2 — Sua cápsula sonora

Feche o app, extraia em outra pasta e execute na pasta mattoz-music-player:

```powershell
npm.cmd ci
npm.cmd start
```

O banco permanece no mesmo perfil. Biblioteca e playlists existentes são mantidas.

## Novo início

Cápsula sonora reúne até 20 músicas ordenadas pelo tempo ouvido nesta versão.
Não é um serviço de recomendações externas. Antes de haver escutas, mostra estado
vazio verdadeiro. Cards de recentes e playlists dão acesso direto à coleção.
O tempo é de reprodução ativa, incluindo quando o volume está mudo; não mede se
uma pessoa estava presente. Pausas, espera de carregamento e saltos no áudio não
contam. Gravação em intervalos de 5 segundos; ao encerrar abruptamente, os últimos
segundos podem se perder. O histórico antigo não contém duração e não é convertido
em tempo fictício. Dados são locais no SQLite, sem envio de estatísticas.
A página inicial atualiza os números a cada 15 segundos enquanto está visível.

## Playlists

Cards com capa automática: quatro artes diferentes formam um mosaico; havendo
menos de quatro, usa a primeira. Sem capa, usa símbolo musical.
Abra uma playlist para ver nome, descrição, total de faixas e duração.
Reproduzir mantém a ordem salva; Misturar cria uma ordem temporária na fila.
Editar nome e descrição altera apenas os dados do aplicativo.
Busque faixas da playlist ou abra Adicionar músicas da biblioteca, pesquise por
música/artista/álbum, marque várias e confirme. Mostra até 100 candidatos por busca;
refine o texto para encontrar outras músicas. Não duplica faixas já presentes ao
adicionar pela nova interface. Duplicatas antigas são preservadas.
Use ↑/↓ para mover e × para remover. Cada ocorrência é manipulada pela posição.
Excluir playlist pede confirmação e nunca apaga arquivos pessoais.

## Arquivos e testes

src/main/listening.cjs: acumulação validada de segundos.
src/renderer/listening.js: observa eventos de reprodução, sem controlar áudio.
src/renderer/home.js: início pessoal e cápsula.
src/renderer/music-ui.js: capas, cards e reprodução de seleções.
src/renderer/saved-ui.js: nova experiência de playlists.
SQLite existente recebe novos dados de estatística/descrição, sem substituir a coleção.

Verificação de sintaxe e 23 testes Node passaram, incluindo contador de tempo com
pausa/seek em ambiente simulado. Não houve inspeção visual real nem teste sonoro no
Windows. Não foi alterado o motor de áudio ou o parser de letras.

## Conferir no Windows

1. Confira suas playlists antigas e músicas após abrir a nova versão.
2. Toque por um minuto, pause por um minuto, depois avance na faixa.
   O tempo ouvido não deve incluir pausa nem o trecho pulado.
3. Volte ao início e confira cápsula e números. Feche e reabra para validar persistência.
4. Abra uma playlist pelo card do início e pela barra lateral.
5. Edite nome/descrição, adicione várias faixas, busque, reorganize e remova.
6. Confira duração, reprodução em ordem e modo Misturar, sem alterar ordem salva.
7. Confira capas/mosaicos e músicas sem arte. Teste janelas pequenas.
8. Confira áudio, letras e tela imersiva para regressões.
