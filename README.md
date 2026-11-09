# MATTOZ Music Player

Downloads, atualizações e código público do MATTOZ Music Player: sua música, seu espaço.

Player local para Windows x64 com biblioteca de MP3s, playlists, letras LRC,
busca de letras online, vinil interativo, mini player, equalizador, crossfade,
modo álbum, capas animadas e estatísticas de audição.

## Baixar

Abra [Releases](https://github.com/joaogamesyt324/mattoz-releases/releases).

- **Portable**: abre sem instalar. Extraia um ZIP antes de executar, se aplicável.
- **Setup**: instala no Windows e cria atalhos.

O launcher da prévia 17 consulta este repositório. Ele abre o download no
navegador; execute o arquivo baixado para atualizar. Dados da biblioteca ficam
no perfil do usuário do Windows. Seus MP3s permanecem nas pastas originais.

## Desenvolver

Requer Node.js 22 ou superior. No PowerShell:

```powershell
npm.cmd ci
npm.cmd start
```

```powershell
npm.cmd run check
npm.cmd test
npm.cmd run dist:win
```

Os executáveis e `release.json` são gerados em `dist/`. Os scripts verificam
o CRC interno de ambos os pacotes NSIS e geram os hashes SHA-256.

## Publicação automática

O workflow **MATTOZ Windows** testa e compila no Windows em cada push na
`main` e em pull requests. Somente a `main` do repositório oficial pode publicar.

Para uma nova versão:

1. Atualize `package.json` e `package-lock.json` com o mesmo número de versão.
2. Escreva as novidades em `RELEASE-NOTES.md`, incluindo esse número.
3. Envie as alterações revisadas à `main`.
4. Acompanhe [Actions](https://github.com/joaogamesyt324/mattoz-releases/actions).

Se os testes e a compilação passarem, uma versão ainda não publicada recebe
uma release com os dois EXEs, manifesto e SHA-256. O upload acontece em rascunho;
a release só fica pública depois que todos os arquivos terminam de carregar.
Versões com sufixo como `-preview.18` são marcadas como prévia automaticamente.
Uma release já publicada nunca é sobrescrita. Alterações sem mudança da versão
apenas validam e geram um artefato de teste, disponível em Actions por 14 dias.
Se um upload falhar e deixar um rascunho, revise-o antes de tentar novamente.

Não é necessário fornecer um token pessoal: Actions usa o token temporário do
próprio GitHub. A primeira execução ainda precisa confirmar a configuração do
runner e as permissões de Actions desta conta.

O aplicativo continua em prévia, sem assinatura digital dos executáveis.
O histórico de implementação está em [HISTORICO.md](HISTORICO.md).
