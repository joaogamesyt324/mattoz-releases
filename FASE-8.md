# MATTOZ 0.8.0 — Fase 8

## Mudanças
- Ferramenta electron-builder atualizada de 26.0.12 para 26.18.0.
- Auditoria reproduzida: 25 alertas antes (13 moderados, 11 altos, 1 crítico); 15 moderados depois, zero altos/críticos. Os alertas restantes vêm da árvore de empacotamento, principalmente minimatch. Não foi aplicado npm audit fix --force nem substituição incompatível de dependências.
- Auditoria das dependências de produção: zero alertas conhecidos. Isso não significa garantia de ausência de falhas. Relatórios JSON em reports/.
- Ícone MATTOZ próprio para janela, instalador e atalhos.
- Instalador NSIS próprio, por usuário, com atalho na área de trabalho e menu Iniciar. Os arquivos do aplicativo ficam em LocalAppData/Programs/MATTOZ Music Player/app; o perfil e os MP3s não são removidos na desinstalação.
- Tela inicial respeita o foco: a atualização periódica não remove um botão enquanto ele está selecionado. Capas personalizadas das playlists aparecem também no início.
- Áudio e sincronização LRC preservados.

## Código-fonte
Recomendado Node 24. Na pasta extraída:

    npm.cmd ci
    npm.cmd start

Para testes: npm.cmd run check e npm.cmd test.
Para compilar Windows x64: npm.cmd run dist:win.
O instalador usa um script próprio em build/installer.nsi; instalação por usuário em pasta fixa. Não há atualização automática nem certificado Authenticode. O aplicativo interno mantém o executável-base do Electron; a identidade visual é aplicada na janela e nos atalhos.

## Validação e limites
27 testes automatizados aprovados e checagem de sintaxe concluída. Testes abrangem fila, persistência, letras, metadados, segurança IPC, backup, telas em DOM simulado, singles e vinil. Serviços online testados com respostas simuladas.
Não foi possível executar o aplicativo e instalar/desinstalar em Windows real neste ambiente. A conferência visual, o desempenho com sua coleção e os serviços online ao vivo continuam pendentes. Esta entrega é candidata a teste, não declaração de versão estável homologada.

Antes de atualizar, exporte um backup no Estúdio da coleção. Feche a versão anterior antes de instalar. Após abrir, confira biblioteca/playlists; se o perfil não aparecer, use Restaurar backup, sem apagar os arquivos originais.
