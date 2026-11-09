# Validação — Fase 6 / 0.6.0

Verificação de sintaxe: passou. 19 testes Node: passaram.
Incluem regressão de áudio/fila/LRC, metadados, SQLite/reabertura, cache online com
respostas simuladas e novas preferências: mesclagem, defaults e validação.
O teste de animação usa DOM simulado; não é medição de FPS nem inspeção visual.
Não executado aqui: janela Electron, inspeção visual em Windows ou LRCLIB real.

## Aceitação no Windows

1. Abra com npm.cmd start e confirme versão 0.6.0 em Configurações.
2. Confira biblioteca e playlists previamente salvas, sem reimportar.
3. Alterne fundos e cores. Troque tamanho de letra enquanto exibe um LRC longo.
4. Ative movimento reduzido, depois Seguir sistema. Confira transições e seek.
5. Altere o volume e reabra: tema, cor, tamanho e volume devem permanecer.
6. Desative Acompanhar versos nas configurações e na tela de letras. Reabra.
7. Reduza a janela a 800 × 620: confira barra inferior, menus e configurações.
8. Navegue por teclado, confira foco e controles sem truncamento.
9. Busque letra: botão fica ocupado e libera ao concluir. HTTP 502/503/504 deve
   informar indisponibilidade do serviço, sem interromper a música.
10. Confira reprodução, playlists, histórico, importação e uso offline.

Se alguma opção ou disposição não se comportar como esperado, envie a descrição
e, para problemas visuais, um print da janela.
