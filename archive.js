'use strict';

const archive = document.getElementById('project-groups');
const archiveTools = document.querySelector('[data-archive-tools]');
const search = document.getElementById('project-search');
const filters = [...archiveTools.querySelectorAll('[data-filter]')];
const views = [...archiveTools.querySelectorAll('[data-archive-view]')];
const feedback = archiveTools.querySelector('[data-result-count]');
const reset = archiveTools.querySelector('[data-archive-reset]');
const groups = [...archive.querySelectorAll('.archive-group')];
const records = [...archive.querySelectorAll('.archive-record')];
const flatList = document.createElement('div');
flatList.className = 'archive-records archive-all-records';
archive.prepend(flatList);

let category = 'all';
let currentPlacement;

function normalize(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replaceAll('ß', 'ss');
}

const recordData = records.map(record => ({
  record,
  parent: record.parentElement,
  searchText: normalize([
    record.id,
    record.querySelector('summary').textContent,
    ...[...record.querySelectorAll('summary [data-de], .archive-record-description')]
      .flatMap(node => [node.textContent, node.dataset.de])
  ].join(' '))
}));
const chronological = [...records].sort((first, second) =>
  Number(second.dataset.sortYear) - Number(first.dataset.sortYear));

function currentHash() {
  try {
    return decodeURIComponent(location.hash.slice(1));
  } catch {
    return '';
  }
}

function setProjectHash(id = '') {
  const url = new URL(location.href);
  url.hash = id;
  history.replaceState(history.state, '', url);
}

function updateArchive() {
  const all = category === 'all';
  if (all !== currentPlacement) {
    if (all) flatList.append(...chronological);
    else recordData.forEach(({record, parent}) => parent.append(record));
    currentPlacement = all;
  }
  flatList.hidden = !all;

  const query = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
  reset.hidden = all && !search.value;
  const linkedProject = currentHash();
  let count = 0;
  for (const {record, searchText} of recordData) {
    const matchingCategory = all || record.dataset.category === category;
    const visible = matchingCategory && query.every(term => searchText.includes(term));
    record.hidden = !visible;
    if (visible) count++;
    else {
      record.open = false;
      if (record.id === linkedProject) setProjectHash();
    }
  }
  for (const group of groups) {
    group.hidden = all || !group.querySelector('.archive-record:not([hidden])');
  }
  for (const filter of filters) {
    filter.setAttribute('aria-pressed', String(filter.dataset.filter === category));
  }

  const german = document.documentElement.lang === 'de';
  const next = german
    ? (count === 0 ? 'Keine Projekte gefunden.' : `${count} ${count === 1 ? 'Projekt' : 'Projekte'}`)
    : (count === 0 ? 'No projects found.' : `${count} ${count === 1 ? 'project' : 'projects'}`);
  if (feedback.textContent !== next) feedback.textContent = next;
}

filters.forEach((filter, index) => {
  filter.addEventListener('click', () => {
    category = filter.dataset.filter;
    updateArchive();
  });
  filter.addEventListener('keydown', event => {
    let next;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % filters.length; break;
      case 'ArrowLeft': next = (index - 1 + filters.length) % filters.length; break;
      case 'Home': next = 0; break;
      case 'End': next = filters.length - 1; break;
      default: return;
    }
    event.preventDefault();
    filters[next].focus();
    filters[next].click();
  });
});

for (const view of views) {
  view.addEventListener('click', () => {
    archive.classList.toggle('is-card-view', view.dataset.archiveView === 'cards');
    views.forEach(button => button.setAttribute('aria-pressed', String(button === view)));
  });
}

for (const button of archiveTools.querySelectorAll('[data-archive-expand]')) {
  button.addEventListener('click', () => {
    const expanding = button.dataset.archiveExpand === 'all';
    records.forEach(record => { record.open = expanding && !record.hidden; });
    if (!expanding && records.some(record => record.id === currentHash())) setProjectHash();
  });
}

for (const record of records) {
  record.querySelector('summary').addEventListener('click', () => {
    // The native disclosure toggles after this click. Bulk actions set open directly.
    if (record.open) {
      if (currentHash() === record.id) setProjectHash();
      return;
    }
    records.forEach(other => {
      if (other !== record) other.open = false;
    });
    setProjectHash(record.id);
  });
  record.addEventListener('toggle', () => {
    if (!record.open) record.querySelector('video')?.pause();
  });
}

for (const button of archive.querySelectorAll('[data-game-toggle]')) {
  const container = document.getElementById(button.getAttribute('aria-controls'));
  const game = container.querySelector('iframe');

  function setGameOpen(open) {
    container.hidden = !open;
    button.setAttribute('aria-expanded', String(open));
    if (open) game.src = game.dataset.gameSrc;
    else game.removeAttribute('src');
  }

  button.hidden = false;
  button.addEventListener('click', () => setGameOpen(container.hidden));
  const record = button.closest('.archive-record');
  record.addEventListener('toggle', () => {
    if (!record.open && !container.hidden) setGameOpen(false);
  });
}

function openHash() {
  const id = currentHash();
  const project = records.find(record => record.id === id);
  const group = groups.find(section => section.id === id);
  if (!project && !group) return;
  category = project?.dataset.category ?? group.id;
  search.value = '';
  updateArchive();
  if (project) records.forEach(record => { record.open = record === project; });
  requestAnimationFrame(() => (project || group).scrollIntoView({block: 'start', behavior: 'instant'}));
}

document.addEventListener('DOMContentLoaded', () => {
  updateArchive();
  openHash();
  archiveTools.hidden = false;
}, {once: true});
reset.addEventListener('click', () => {
  search.value = '';
  category = 'all';
  setProjectHash();
  search.focus();
  updateArchive();
});
search.addEventListener('input', updateArchive);
document.addEventListener('notedbit:languagechange', updateArchive);
window.addEventListener('hashchange', openHash);
