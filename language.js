(() => {
  "use strict";

  // English remains the source language in the HTML. Translations are applied
  // to text nodes and accessibility metadata, without rewriting markup/links.
  const german = {
    "Skip to content": "Zum Inhalt springen",
    "Media": "Medien",
    "Incomplete coursework": "Unvollständige Studienarbeit",
    "HTML · CSS · JavaScript · GitHub Pages": "HTML · CSS · JavaScript · GitHub Pages",
    "Coursework": "Studienübung",
    "Skip to game": "Zum Spiel springen",
    "notedbit home": "notedbit – Startseite",
    "Primary navigation": "Hauptnavigation",
    "Game navigation": "Spielnavigation",
    "Open navigation": "Navigation öffnen",
    "Close navigation": "Navigation schließen",
    "Projects": "Projekte",
    "About": "Über mich",
    "Contact": "Kontakt",
    "Email": "E-Mail",
    "All projects": "Alle Projekte",
    "Project details": "Projektdetails",
    "Project": "Projekt",
    "Play": "Spielen",
    "Background": "Hintergrund",
    "Data": "Daten",
    "Browser adaptation": "Browser-Adaption",
    "Controls": "Steuerung",
    "Gold": "Gold",
    "Level": "Level",
    "Restart": "Neustart",
    "Fullscreen": "Vollbild",
    "Exit fullscreen": "Vollbild verlassen",
    "Enter fullscreen": "Vollbild aktivieren",
    "Choose a character": "Charakter wählen",
    "Enter the dungeon": "Dungeon betreten",
    "Fighter": "Kämpfer",
    "50 HP · 15 attack": "50 LP · 15 Angriff",
    "Mage": "Magier",
    "20 HP · 8 attack · teleport": "20 LP · 8 Angriff · Teleportation",
    "Start game": "Spiel starten",
    "Game over": "Spiel vorbei",
    "Run ended": "Durchlauf beendet",
    "Play again": "Erneut spielen",
    "Current run": "Aktueller Durchlauf",
    "Select a character to begin.": "Wähle einen Charakter, um zu beginnen.",
    "Original mechanics": "Originalmechaniken",
    "Randomized 20×20 dungeon levels": "Zufallsgenerierte Dungeon-Level (20 × 20)",
    "Skeletons and bats move after your turn": "Skelette und Fledermäuse bewegen sich nach deinem Zug",
    "Chests contain gold and healing": "Truhen enthalten Gold und Heilung",
    "Bats can poison the player": "Fledermäuse können den Spieler vergiften",
    "Mage teleport costs 100 gold": "Teleportation des Magiers kostet 100 Gold",
    "Reach the gate to advance": "Erreiche das Tor, um weiterzukommen",
    "About this version": "Über diese Version",
    "The original project ran as C++ code with AlgoViz. This version ports the core gameplay to JavaScript so it can be played directly on notedbit.": "Das Original lief als C++-Programm mit AlgoViz. Diese Version überträgt die zentralen Spielmechaniken nach JavaScript und ist direkt auf notedbit spielbar.",
    "A bat poisoned you for 5 turns.": "Eine Fledermaus hat dich für 5 Züge vergiftet.",
    "Bat defeated.": "Fledermaus besiegt.",
    "A wall blocks the way.": "Eine Wand versperrt den Weg.",
    "The chest is already empty.": "Die Truhe ist bereits leer.",
    "Teleported three tiles.": "Drei Felder teleportiert.",
    "Teleport requires 100 gold.": "Teleportation kostet 100 Gold.",
    "Teleport is a Mage ability.": "Nur der Magier kann sich teleportieren.",
    "You need 100 gold to teleport.": "Du benötigst 100 Gold zum Teleportieren.",
    "Teleport ready. Choose a direction.": "Teleportation bereit. Wähle eine Richtung.",
    "Teleport cancelled.": "Teleportation abgebrochen.",
    "Loading game assets…": "Spielgrafiken werden geladen …",
    "The game assets could not be loaded.": "Die Spielgrafiken konnten nicht geladen werden.",
    "Play Dungeon Crawler — notedbit": "Dungeon Crawler spielen – notedbit",
    "Touch controls": "Touch-Steuerung",
    "Dungeon Crawler game area": "Dungeon-Crawler-Spielfeld",
    "Move up": "Nach oben bewegen",
    "Move down": "Nach unten bewegen",
    "Move left": "Nach links bewegen",
    "Move right": "Nach rechts bewegen",
    "Toggle mage teleport": "Teleportation des Magiers umschalten"
  };
  const storageKey = "notedbit-language";
  const textState = new WeakMap();
  const attributeState = new WeakMap();
  let currentLanguage = "en";

  function chooseInitialLanguage() {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved === "de" ? "de" : "en";
    } catch (_) {
      return "en";
    }
  }

  function dynamicGerman(text) {
    let match;
    if ((match = /^Level (\d+)\. Reach the gate at the top\.$/.exec(text))) return `Level ${match[1]}. Erreiche das Tor am oberen Rand.`;
    if ((match = /^Poison deals 8 damage\. (\d+) poisoned turns? left\.$/.exec(text))) return `Gift verursacht 8 Schaden. Noch ${match[1]} vergiftete Züge.`;
    if ((match = /^Skeleton defeated\. \+(\d+) gold\.$/.exec(text))) return `Skelett besiegt. +${match[1]} Gold.`;
    if ((match = /^You hit the (skeleton|bat) for (\d+) damage\.$/.exec(text))) return `Du triffst ${match[1] === "bat" ? "die Fledermaus" : "das Skelett"} und verursachst ${match[2]} Schaden.`;
    if ((match = /^Chest opened: \+(\d+) gold, \+(\d+) HP\.$/.exec(text))) return `Truhe geöffnet: +${match[1]} Gold, +${match[2]} LP.`;
    if ((match = /^You collected (\d+) gold before the run ended\.$/.exec(text))) return `Du hast vor dem Ende des Durchlaufs ${match[1]} Gold gesammelt.`;
    return text;
  }

  const translate = (text) => Object.hasOwn(german, text) ? german[text] : dynamicGerman(text);
  const normalized = (value) => value.trim().replace(/\s+/g, " ");

  function translateContent(value, language) {
    if (language === "en" || !value.trim()) return value;
    const leading = value.match(/^\s*/)[0];
    const trailing = value.match(/\s*$/)[0];
    const source = normalized(value);
    const localized = translate(source);
    return localized === source ? value : leading + localized + trailing;
  }

  function localizeText(node) {
    if (!node || !node.parentElement || node.parentElement.closest("script, style, noscript")) return;
    const raw = node.nodeValue;
    let state = textState.get(node);
    if (!state || raw !== state.output) {
      state = { english: raw, output: raw };
      textState.set(node, state);
    }
    const directGerman = node.parentElement.getAttribute("data-de");
    const updated = directGerman !== null
      ? (currentLanguage === "de" ? state.english.replace(/\S(?:[\s\S]*\S)?/, () => directGerman) : state.english)
      : translateContent(state.english, currentLanguage);
    state.output = updated;
    if (raw !== updated) node.nodeValue = updated;
  }

  const translatedAttributes = ["aria-label", "alt", "title", "placeholder", "content"];
  function localizeAttributes(element) {
    if (!element || element.nodeType !== 1 || element.closest("script, style")) return;
    let attrs = attributeState.get(element);
    if (!attrs) { attrs = {}; attributeState.set(element, attrs); }
    for (const attribute of translatedAttributes) {
      if (!element.hasAttribute(attribute)) continue;
      if (attribute === "content" && !element.matches("meta[name='description'],meta[property='og:title'],meta[property='og:description']")) continue;
      const raw = element.getAttribute(attribute);
      const state = attrs[attribute];
      if (!state || state.output !== raw) attrs[attribute] = { english: raw, output: raw };
      const directGerman = element.getAttribute("data-" + attribute + "-de");
      const output = directGerman !== null && currentLanguage === "de"
        ? directGerman : translateContent(attrs[attribute].english, currentLanguage);
      attrs[attribute].output = output;
      if (raw !== output) element.setAttribute(attribute, output);
    }
  }

  function visit(root) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) { localizeText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) localizeAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let item;
    while ((item = walker.nextNode())) {
      if (item.nodeType === Node.TEXT_NODE) localizeText(item);
      else localizeAttributes(item);
    }
  }

  function renderLanguage() {
    document.documentElement.lang = currentLanguage;
    document.querySelectorAll("[data-language-switch] [data-lang]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.lang === currentLanguage));
    });
    visit(document.head);
    visit(document.body);
  }

  function updateLanguage(language) {
    currentLanguage = language;
    renderLanguage();
    document.dispatchEvent(new CustomEvent("notedbit:languagechange", { detail: { language } }));
  }

  function setLanguage(language) {
    if (language !== "de" && language !== "en") return;
    try { localStorage.setItem(storageKey, language); } catch (_) { /* private browsing */ }
    updateLanguage(language);
  }

  document.addEventListener("DOMContentLoaded", () => {
    currentLanguage = chooseInitialLanguage();
    document.querySelectorAll("[data-language-switch] [data-lang]").forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.lang));
    });
    renderLanguage();
    window.addEventListener("storage", (event) => {
      if (event.key === storageKey && event.newValue !== currentLanguage) {
        updateLanguage(event.newValue === "de" ? "de" : "en");
      }
    });
    // The game updates messages and the fullscreen label dynamically. Translate
    // new nodes without modifying any game mechanics or rendering functions.
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") visit(record.target);
        else if (record.type === "attributes") localizeAttributes(record.target);
        else if (record.type === "childList") record.addedNodes.forEach(visit);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "alt", "title", "placeholder"] });
  });
})();
