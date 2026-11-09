# MATTOZ 0.7.2 — Singles e vinil

Abra com npm.cmd ci e npm.cmd start na pasta extraída.

## Singles
Nova opção no menu lateral. Adicionar singles abre o seletor de MP3s: os arquivos entram na biblioteca e na coleção Singles, sem iniciar a reprodução nem substituir a fila. Também é possível escolher várias músicas já importadas. Busca por título/artista, capa, reprodução individual e remoção da coleção. Não altera tags de álbum no MP3 e não apaga arquivos. A classificação é manual e persiste no banco e no backup.

## Vinil na tela imersiva
Abra Expandir música. Ao lado da capa aparece um disco com sulcos, reflexo e selo central usando a mesma arte. Sem capa, o selo mostra m. A rotação acompanha o estado de reprodução e fica pausada em pausa, carregamento, busca de posição, fim e erro. Não escreve no relógio do áudio. A preferência de movimento reduzido desativa a animação. Em janelas menores, o conjunto fica acima do título e letra.

## Verificação
27 testes passaram, com novas verificações de persistência/idempotência de singles e estados do vinil em DOM simulado. Sintaxe conferida. Não foi feita validação visual nem reprodução real no Windows neste ambiente.
Teste no Windows: importar single, reiniciar, reproduzir, abrir tela imersiva, pausar/retomar, trocar faixa com/sem capa, reduzir janela e ativar movimento reduzido.

O ZIP contém código-fonte; o instalador EXE segue dependente da compilação Windows descrita em FASE-7.md.
