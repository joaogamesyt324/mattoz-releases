# MATTOZ 0.8.1 — rolagem das letras

Investigação: o leitor anterior usava interpolação exponencial sem velocidade acumulada e mantinha requestAnimationFrame ativo durante pausa. As regras genéricas de botão também tinham prioridade sobre parte das transições da letra.

Agora há um único ciclo de animação com movimento criticamente amortecido. Cada novo timestamp muda o destino preservando posição e velocidade. A posição interna usa precisão fracionária, mesmo quando o navegador arredonda scrollTop. O destaque continua sendo determinado por audio.currentTime e pelos offsets LRC existentes; o motor de áudio não foi modificado.

Pausa, buffering e leitor oculto suspendem o ciclo e as transições CSS. A retomada reinicia o relógio de quadros sem incluir o tempo parado. Busca na faixa zera a velocidade anterior; voltar antes do primeiro timestamp retorna suavemente ao início quando a reprodução está ativa. Ao buscar com a música pausada, a linha ativa é atualizada, mas a rolagem aguarda a retomada. Redimensionamento e preferências recalculam o destino. Movimento reduzido permanece respeitado.

Validação: npm run check e 27 testes automatizados; regressão de pausa/retomada, buffering, visibilidade, follow desligado, retorno ao início, posições arredondadas, transições pausadas e movimento reduzido. Testes de integração existentes cobrem leitura de LRC, busca/cache online, playlists e inicialização de todas as telas.

Instalação: exporte um backup e feche a versão anterior; execute MATTOZ-Setup-0.8.1-x64.exe. O instalador não é assinado digitalmente. A compilação e os testes automatizados foram realizados em Linux; a aparência e a instalação precisam de validação final no Windows.

Pelo código-fonte: extraia a pasta, execute npm.cmd ci e npm.cmd start. Para compilar: npm.cmd run dist:win.

## Correção do instalador (revisão da distribuição)
O primeiro instalador distribuído tinha 213.909.504 bytes, enquanto seu cabeçalho declarava 248.658.434 bytes, e foi rejeitado pelo NSIS. Esta revisão mantém o player 0.8.1 e recompila o instalador a partir de um destino limpo, com Unicode e CRC obrigatório.

O comando npm.cmd run dist:win remove o instalador anterior, compila e verifica o tamanho declarado e o CRC interno. scripts/check-installer.cjs também pode verificar um arquivo fornecido como argumento. Os testes incluem detecção de truncamento e corrupção.

Validação automatizada: 28 testes aprovados. A instalação no Windows ainda precisa ser validada nesse sistema; a compilação é realizada em Linux. O executável não possui assinatura digital.
