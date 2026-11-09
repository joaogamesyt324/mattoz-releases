'use strict';

const pages = {
  queue: { label: 'Fila de reprodução', section: 'queue' },
  home: { label: 'Início', section: 'home' },
  library: { label: 'Sua biblioteca', section: 'library-page', title: 'Sua biblioteca começa aqui', description: 'Adicione sua coleção de MP3s quando a importação estiver disponível. Seus arquivos continuarão nas pastas originais.', action: 'Importar músicas · Fase 4' },
  albums: { label: 'Álbuns', section: 'library-page', title: 'Seus álbuns, por inteiro', description: 'Capas e informações dos álbuns aparecerão aqui após a implementação da leitura de metadados.', action: 'Importar álbuns · Fase 4' },
  artists: { label: 'Artistas', section: 'library-page', title: 'Encontre suas vozes favoritas', description: 'Os artistas serão organizados a partir dos metadados da sua coleção local.', action: 'Importar músicas · Fase 4' },
  playlists: { label: 'Playlists', section: 'saved-page', title: 'Uma seleção com a sua assinatura', description: 'Criação, edição e organização de playlists serão disponibilizadas na Fase 5.', action: 'Criar playlist · Fase 5' },
  recent: { label: 'Recentes', section: 'saved-page', title: 'Suas últimas descobertas', description: 'Seu histórico de reprodução aparecerá aqui quando a persistência local for implementada.', action: 'Histórico local · Fase 5' },
  lyrics: { label: 'Letras', section: 'lyrics' },
  settings: { label: 'Configurações', section: 'settings' }
};

function navigate(key, focus = true) {
  const page = pages[key];
  if (!page) return;
  document.querySelectorAll('.page').forEach(section => { section.hidden = section.id !== page.section; });
  document.querySelectorAll('[data-page]').forEach(button => {
    if (button.dataset.page === key) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  document.getElementById('breadcrumb').textContent = `Seu espaço / ${page.label}`;
  if (page.section === 'collection') {
    document.getElementById('collection-title').textContent = page.label;
    document.getElementById('empty-title').textContent = page.title;
    document.getElementById('empty-description').textContent = page.description;
    document.getElementById('future-action').textContent = page.action;
  }
  document.querySelector('.workspace').scrollTop = 0;
  window.dispatchEvent(new CustomEvent('mattoz-page', {detail:key}));
  if (focus) document.getElementById('content').focus({ preventScroll: true });
}

document.querySelectorAll('[data-page]').forEach(button => {
  button.addEventListener('click', () => navigate(button.dataset.page));
});

document.addEventListener('keydown', event => {
  if (!(event.ctrlKey || event.metaKey) || event.altKey || event.shiftKey || event.repeat) return;
  if (event.target.closest('input, textarea, [contenteditable="true"]')) return;
  const key = { '1': 'home', '2': 'library', ',': 'settings', l: 'lyrics' }[event.key.toLowerCase()];
  if (key) { event.preventDefault(); navigate(key); }
});

async function initialize() {
  navigate('home', false);
  try {
    if (!window.mattoz?.getAppInfo) throw new Error('Ponte Electron indisponível');
    const info = await window.mattoz.getAppInfo();
    document.getElementById('version').textContent = `v${info.version} · FASE ${info.phase}`;
    document.getElementById('app-info').textContent = `${info.name} · v${info.version} · Electron ${info.electron} · ${info.platform}. Comunicação com o aplicativo estabelecida.`;
  } catch (error) {
    console.error('Inicialização:', error);
    document.getElementById('app-info').textContent = 'Não foi possível obter as informações do aplicativo.';
    document.getElementById('status').textContent = 'Conexão com o aplicativo indisponível. Abra pelo comando npm start; se o erro persistir, reinicie o MATTOZ.';
  }
}
initialize();
