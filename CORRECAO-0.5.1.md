# Atualização 0.5.1

Busca e download agora usam net.fetch do Electron, com a rede do Chromium e suporte
às configurações de proxy do sistema. A causa da falha no computador do usuário
não foi confirmada. Mensagens agora incluem o erro real e códigos HTTP do serviço.
Não foram alterados áudio, animação, banco ou playlists.

Feche a versão antiga. Extraia em outra pasta e execute npm.cmd ci e npm.cmd start.
O banco permanece no mesmo perfil do usuário. Não exclua a pasta de dados do app.
17 testes e verificação de sintaxe passaram. Rede testada apenas com respostas
simuladas; net.fetch real e reprodução no Windows ainda precisam de validação.
Se falhar, envie a mensagem exata exibida abaixo dos controles de letras.
