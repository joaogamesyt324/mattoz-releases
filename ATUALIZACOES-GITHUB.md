# Canal oficial — prévia 17

Repositório: https://github.com/joaogamesyt324/mattoz-releases

Esta versão consulta a API pública de Releases do GitHub ao clicar em
“Consultar atualização” na tela de boas-vindas. Não exige conta ou token.
Instalações de prévia aceitam prévias e versões estáveis; versões estáveis
ignoram prévias. A comparação usa versões semânticas e nunca oferece downgrade.
O pacote corresponde à edição em uso: portátil ou instalador.

## Publicar esta versão

1. Extraia os ZIPs entregues.
2. Crie uma release com a tag `v0.9.0-preview.17` e marque como prévia.
3. Anexe os dois executáveis, mantendo os nomes:
   - `MATTOZ-Portable-0.9.0-preview.17-x64.exe`
   - `MATTOZ-Setup-0.9.0-preview.17-x64.exe`
4. Publique depois que ambos terminarem de carregar.

Não é necessário publicar release.json. A API fornece nome, endereço, tamanho
e SHA-256 dos executáveis. O launcher valida esses dados e abre o download no
navegador. Ele não baixa, verifica os bytes nem instala automaticamente.

A prévia 16 ainda não conhece este canal. Abra ou instale a prévia 17 manualmente
uma vez. Antes de publicar a 17, ela informa que é mais recente que a última
publicada (16), o que é esperado.

Próximas versões devem manter o mesmo padrão de tags e nomes de arquivos.
Versões em rascunho são ignoradas. São examinadas até 300 releases recentes.

## Validação desta entrega

- Sintaxe: 54 arquivos válidos; testes automatizados: 70 aprovados.
- API pública consultada de verdade via HTTPS: prévia 16 pública, ambos os
  executáveis disponíveis com SHA-256. Código de seleção testado com a resposta
  real: versão 15 recebe a 16; versão 17 não recebe downgrade.
- Teste de reprodução em Electron/Linux: crossfade, EQ, pausa, seek, letras,
  vídeo e modo álbum sem intervalo de amostras aprovados.
- O acesso direto via Electron net.fetch neste ambiente retornou
  ERR_EMPTY_RESPONSE; o acesso HTTPS por curl funcionou. A consulta dentro do
  aplicativo e a execução dos EXEs ainda precisam de teste no Windows.
- Executáveis sem assinatura digital. CRC dos pacotes é validado na geração.

O motor de áudio e os dados da biblioteca não foram alterados nesta entrega.
