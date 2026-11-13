/* Bibilingo 2.0 – traduction automatique entre 15 langues. Code original. */
"use strict";
(function () {
  var VERSION = "2.0.0";
  var $ = function (id) { return document.getElementById(id); };
  var LANGS = window.BIBI_LANGS, VOCAB = window.BIBI_VOCAB, THEMES = window.BIBI_THEMES, TR = window.BibiTranslit;
  var MAX_LEN = 500;

  /* ---------- pont avec l'application Android (si présente) ---------- */
  var NATIVE = (function () { try { return window.BibiNative ? JSON.parse(window.BibiNative.info()) : null; } catch (e) { return null; } })();
  var pending = {}, seq = 0, listenHandler = null;
  window.BibiBridge = {
    cb: function (id, ok, data) {
      if (id === "listen") { if (listenHandler) { try { listenHandler(JSON.parse(data)); } catch (e) { } } return; }
      var f = pending[id]; if (!f) return;
      if (!/:progress$/.test(id)) delete pending[id];
      f(ok, data);
    }
  };
  function nativeCall(fn, onProgress) {
    return new Promise(function (resolve) {
      var id = "n" + (++seq);
      pending[id] = function (ok, data) { delete pending[id + ":progress"]; resolve({ ok: ok, data: data }); };
      if (onProgress) pending[id + ":progress"] = function (ok, data) { onProgress(data); };
      fn(id);
    });
  }

  /* ---------- stockage local ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("bibi." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("bibi." + k, JSON.stringify(v)); } catch (e) { } }
  };
  var settings = Object.assign({ autoplay: true, online: false, rate: 0.95, keepHisto: true, micConsent: false, translit: true, voices: {} },
    store.get("settings", {}));
  if (!settings.voices) settings.voices = {};
  function saveSettings() { store.set("settings", settings); }
  function validId(id, d) { return LANGS.some(function (l) { return l.id === id; }) ? id : d; }
  var state = { src: validId(store.get("src", "fr"), "fr"), tgt: validId(store.get("tgt", "ro"), "ro"), last: null };
  if (state.src === state.tgt) state.tgt = state.src === "fr" ? "ro" : "fr";
  var history = store.get("history", []);
  var favs = store.get("favs", []).filter(function (f) { return f && f.src && f.tgt; });

  function L(id) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === id) return LANGS[i]; return LANGS[0]; }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600); }
  function el(tag, attrs, text) { var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; }

  /* ---------- onglets ---------- */
  function showTab(id) {
    document.querySelectorAll(".panel").forEach(function (p) { p.hidden = p.id !== id; });
    document.querySelectorAll(".tab").forEach(function (b) {
      if (b.dataset.tab === id) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (id === "p-vocab") renderVocab();
    if (id === "p-favs") renderFavs();
    if (id === "p-histo") renderHisto();
    if (id === "p-aide") { renderVoices(); renderCaps(); }
  }
  document.querySelectorAll(".tab").forEach(function (b) { b.addEventListener("click", function () { showTab(b.dataset.tab); }); });
  document.addEventListener("click", function (e) { var g = e.target.closest("[data-goto]"); if (g) showTab(g.dataset.goto); });

  /* ---------- choix des langues (entrée / sortie) ---------- */
  var selSrc = $("src"), selTgt = $("tgt");
  LANGS.forEach(function (l) {
    selSrc.appendChild(el("option", { value: l.id }, l.label));
    selTgt.appendChild(el("option", { value: l.id }, l.label));
  });
  function syncLangs() {
    selSrc.value = state.src; selTgt.value = state.tgt;
    store.set("src", state.src); store.set("tgt", state.tgt);
    $("src-code").textContent = L(state.src).short; $("tgt-code").textContent = L(state.tgt).short;
    $("text").setAttribute("lang", L(state.src).tts);
    $("text").placeholder = "… ou écrivez ici en " + L(state.src).label.replace(/ \(.*\)/, "").toLowerCase();
    renderRecent(); updateMicInfo();
  }
  function setLangs(src, tgt, retranslate) {
    if (src === tgt) { tgt = state.src === src ? state.tgt : state.src; if (src === tgt) tgt = src === "fr" ? "ro" : "fr"; }
    state.src = src; state.tgt = tgt;
    var r = store.get("recent", []); [tgt, src].forEach(function (id) { r = [id].concat(r.filter(function (x) { return x !== id; })); });
    store.set("recent", r.slice(0, 6));
    syncLangs();
    if (retranslate && $("text").value.trim()) doTranslate(false);
  }
  selSrc.addEventListener("change", function () { setLangs(selSrc.value, state.tgt, true); });
  selTgt.addEventListener("change", function () { setLangs(state.src, selTgt.value, true); });
  function swap(withText) {
    var b = $("swap"); b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
    if (withText && state.last && state.last.tgt === state.tgt) $("text").value = state.last.out;
    setLangs(state.tgt, state.src, false);
    if (withText && $("text").value.trim()) doTranslate(false);
  }
  $("swap").addEventListener("click", function () { swap(true); });
  function renderRecent() {
    var box = $("recent"); box.replaceChildren();
    store.get("recent", ["ro", "fr", "en"]).forEach(function (id) {
      if (id === state.tgt || !LANGS.some(function (l) { return l.id === id; })) return;
      var b = el("button", { type: "button", class: "chip", "aria-label": "Traduire en " + L(id).label }, L(id).short);
      b.addEventListener("click", function () { setLangs(state.src, id, true); });
      box.appendChild(b);
    });
  }

  /* ---------- réseau ---------- */
  function updateNet() {
    var on = navigator.onLine;
    $("net").replaceChildren(el("span", on ? null : { class: "off" }, on ? "🟢 En ligne" : "🟠 Hors ligne : vocabulaire, favoris, audio et traducteur de l'appareil"));
  }
  window.addEventListener("online", updateNet); window.addEventListener("offline", updateNet); updateNet();

  /* ---------- 1) vocabulaire et favoris : correspondance quasi exacte ---------- */
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[’']/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }
  function bigrams(s) { var a = [], t = Array.from(s.replace(/ /g, "")); for (var i = 0; i < t.length - 1; i++) a.push(t[i] + t[i + 1]); return a; }
  function dice(a, b) {
    if (a === b) return 1; var x = bigrams(a), y = bigrams(b); if (!x.length || !y.length) return 0;
    var m = {}, hit = 0; x.forEach(function (g) { m[g] = (m[g] || 0) + 1; });
    y.forEach(function (g) { if (m[g] > 0) { m[g]--; hit++; } });
    return (2 * hit) / (x.length + y.length);
  }
  function findKnown(text, srcId, tgtId) {
    var n = norm(text); if (!n) return null;
    var mt = L(srcId).mt, best = null, score = 0;
    VOCAB.forEach(function (v) {
      LANGS.forEach(function (l) {
        if (l.mt !== mt) return;
        var s = dice(n, norm(v[l.id])); if (l.id === srcId) s += 0.001;
        if (s > score) { score = s; best = { out: v[tgtId], entry: v, via: "📚 Vocabulaire Bibilingo · hors ligne" }; }
      });
    });
    favs.forEach(function (f) {
      if (f.tgt !== tgtId || L(f.src).mt !== mt) return;
      var s = dice(n, norm(f.text)); if (s > score) { score = s; best = { out: f.out, via: "⭐ Favori · hors ligne" }; }
    });
    return score >= 0.9 ? best : null; /* seuil élevé : jamais de « presque bonne » phrase */
  }

  /* ---------- 2) traducteur de l'appareil ---------- */
  var translators = {};
  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]);
  }
  function hasDeviceMT() { return !!NATIVE || typeof self.Translator !== "undefined"; }
  async function deviceTranslate(text, a, b) {
    if (NATIVE) {
      try {
        var r = await withTimeout(nativeCall(function (id) { window.BibiNative.translate(id, text, a, b); }), 90000);
        if (r.ok) return r.data;
        if (r.data === "model-missing") toast("Langue non téléchargée : Aide → « Télécharger toutes les langues » (avec internet)");
      } catch (e) { }
      return null;
    }
    if (typeof self.Translator === "undefined") return null;
    var key = a + ">" + b;
    try {
      if (!translators[key]) {
        var av = await withTimeout(self.Translator.availability({ sourceLanguage: a, targetLanguage: b }), 5000);
        if (av === "unavailable") return null;
        if (av !== "available") toast("Téléchargement du modèle " + a + " → " + b + " (une seule fois)…");
        translators[key] = await withTimeout(self.Translator.create({ sourceLanguage: a, targetLanguage: b }), av === "available" ? 15000 : 120000);
      }
      return await withTimeout(translators[key].translate(text), 15000);
    } catch (e) { delete translators[key]; return null; }
  }

  /* ---------- 3) en ligne (désactivé par défaut) ---------- */
  async function onlineTranslate(text, src, tgt) {
    if (!settings.online || !navigator.onLine) return null;
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) +
      "&langpair=" + encodeURIComponent(src.tts + "|" + tgt.tts);
    try {
      var ctrl = new AbortController(); var to = setTimeout(function () { ctrl.abort(); }, 9000);
      var r = await fetch(url, { signal: ctrl.signal, credentials: "omit", referrerPolicy: "no-referrer" });
      clearTimeout(to);
      if (!r.ok) return null; var j = await r.json();
      var out = j && j.responseData && j.responseData.translatedText;
      if (!out || /MYMEMORY WARNING|INVALID|QUERY LENGTH/i.test(out)) return null;
      var d = document.createElement("textarea"); d.innerHTML = String(out); /* décode &#39; etc. (jamais inséré comme HTML) */
      return d.value;
    } catch (e) { return null; }
  }

  async function translate(text, srcId, tgtId) {
    var src = L(srcId), tgt = L(tgtId);
    var k = findKnown(text, srcId, tgtId); if (k) return k;
    if (src.mt === tgt.mt) return { out: text, via: "Même langue (autre variante) : texte gardé tel quel" };
    var d = await deviceTranslate(text, src.mt, tgt.mt);
    if (d) return { out: d, via: NATIVE ? "📱 Traduit sur le téléphone · hors ligne (Google ML Kit)" : "💻 Traduit sur l'ordinateur · hors ligne" };
    var o = await onlineTranslate(text, src, tgt); if (o) return { out: o, via: "🌐 Traduit en ligne (MyMemory)" };
    return null;
  }

  /* ---------- translittération ---------- */
  var pinyinState = "idle";
  function ensurePinyin() {
    if (self.pinyinPro) return Promise.resolve(true);
    if (pinyinState === "failed") return Promise.resolve(false);
    if (!ensurePinyin.p) {
      pinyinState = "loading";
      ensurePinyin.p = new Promise(function (resolve) {
        var s = document.createElement("script"); s.src = "vendor/pinyin-pro.js"; s.async = true;
        s.onload = function () { pinyinState = self.pinyinPro ? "ok" : "failed"; resolve(!!self.pinyinPro); };
        s.onerror = function () { pinyinState = "failed"; resolve(false); };
        document.head.appendChild(s);
      });
    }
    return withTimeout(ensurePinyin.p, 4000).catch(function () { return false; });
  }
  function romanOf(text, langId, entry) {
    var l = L(langId);
    if (l.script === "latin" || !settings.translit) return null;
    if (entry && entry[langId] === text) {
      if (langId === "ja" && entry.jaT) return { text: entry.jaT, note: "Rōmaji (Hepburn)" };
      if (langId === "zh" && entry.zhT) return { text: entry.zhT, note: "Pinyin avec tons" };
    }
    return TR.romanize(text, l.script);
  }
  function exactEntry(text, langId) {
    for (var i = 0; i < VOCAB.length; i++) if (VOCAB[i][langId] === text) return VOCAB[i];
    return null;
  }

  /* ---------- voix (synthèse vocale) : la voix native du pays ---------- */
  var VOICE_PREF = {
    "en-GB": ["en-gb", "en-ie", "en-au", "en"], "pt-BR": ["pt-br", "pt"], "pt-PT": ["pt-pt", "pt"],
    "es-ES": ["es-es", "es"], "es-MX": ["es-mx", "es-us", "es-419", "es"], "es-AR": ["es-ar", "es-419", "es-us", "es-mx", "es"],
    "zh-CN": ["zh-cn", "cmn-cn", "zh-hans-cn", "cmn-hans-cn", "zh-hans", "zh", "cmn"], "ro-RO": ["ro-ro", "ro"], "el-GR": ["el-gr", "el"],
    "ru-RU": ["ru-ru", "ru"], "ja-JP": ["ja-jp", "ja"], "it-IT": ["it-it", "it"], "fr-FR": ["fr-fr", "fr"], "de-DE": ["de-de", "de"], "nl-NL": ["nl-nl", "nl"]
  };
  var synth = window.speechSynthesis, voices = [];
  function loadVoices() { voices = synth ? synth.getVoices() : []; if (!$("p-aide").hidden) renderVoices(); }
  if (synth) { loadVoices(); if (synth.addEventListener) synth.addEventListener("voiceschanged", loadVoices); }
  function vlang(v) { return v.lang.replace(/_/g, "-").toLowerCase(); }
  function rankVoices(code) {
    var pref = VOICE_PREF[code] || [code.toLowerCase(), code.split("-")[0].toLowerCase()];
    return voices.map(function (v) {
      var lg = vlang(v), idx = -1;
      for (var i = 0; i < pref.length; i++) { if (lg === pref[i] || (pref[i].indexOf("-") < 0 && lg.split("-")[0] === pref[i])) { idx = i; break; } }
      if (idx < 0) return null;
      if (code === "pt-PT" && lg === "pt-br") idx = 50; /* le portugais du Brésil n'est qu'un dernier recours */
      if (code === "pt-BR" && lg === "pt-pt") idx = 50;
      var q = (v.localService ? 20 : 0) + (/natural|neural|premium|enhanced|online \(natural\)/i.test(v.name) ? 12 : 0) + (/google/i.test(v.name) ? 4 : 0);
      return { v: v, score: (100 - idx * 10) + q, exact: idx === 0 };
    }).filter(Boolean).sort(function (a, b) { return b.score - a.score; });
  }
  function pickVoice(code) {
    var chosen = settings.voices[code];
    if (chosen) { var c = voices.filter(function (v) { return v.voiceURI === chosen; })[0]; if (c) return c; }
    var r = rankVoices(code); return r.length ? r[0].v : null;
  }
  function setSpeaking(on) { document.body.classList.toggle("speaking", on); }
  function speak(text, code, rate, onEnd) {
    if (NATIVE) {
      window.BibiNative.speak(text, code, rate || settings.rate);
      setSpeaking(true);
      setTimeout(function () { setSpeaking(false); if (onEnd) onEnd(); }, 500 + text.length * 75);
      return;
    }
    if (!synth) { toast("Audio indisponible sur ce navigateur"); return; }
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = code; u.rate = rate || settings.rate;
    var v = pickVoice(code); if (v) { try { u.voice = v; } catch (e) { } }
    u.onend = u.onerror = function () { setSpeaking(false); if (onEnd) onEnd(); };
    setSpeaking(true); synth.speak(u);
  }
  function primeAudio() { /* iPhone : débloque l'audio pendant le geste de l'utilisateur */
    if (synth && !primeAudio.done) { try { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u); } catch (e) { } primeAudio.done = true; }
  }
  function voiceInfo(code) {
    if (NATIVE) return window.BibiNative.hasVoice(code) ? "Voix « " + code + " » du téléphone · hors ligne"
      : "Voix « " + code + " » absente : Aide → « Réglages des voix » pour l'installer.";
    var v = pickVoice(code);
    if (!v) return "Aucune voix « " + code + " » sur cet appareil : installez-la (Aide → Voix).";
    var exact = vlang(v) === code.toLowerCase();
    return "Voix : " + v.name + " (" + v.lang + ")" + (v.localService ? " · hors ligne" : " · voix en ligne") +
      (exact ? "" : " · voix exacte « " + code + " » absente : voix la plus proche");
  }

  /* ---------- affichage du résultat ---------- */
  function segments(text, code) {
    try {
      if (window.Intl && Intl.Segmenter) {
        return Array.from(new Intl.Segmenter(code, { granularity: "word" }).segment(text))
          .filter(function (s) { return s.isWordLike; }).map(function (s) { return s.segment; });
      }
    } catch (e) { }
    return text.split(/\s+/).map(function (w) { return w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""); }).filter(Boolean);
  }
  function fillRoman(box, r) {
    box.replaceChildren();
    if (!r) { box.hidden = true; return; }
    box.hidden = false;
    if (r.text) box.appendChild(el("span", { class: "roman-text", lang: "und-Latn" }, r.text));
    box.appendChild(el("span", { class: "roman-note" }, r.note));
  }
  async function showResult(src, tgt, input, res, autoplay) {
    var lt = L(tgt), ls = L(src);
    var entry = res.entry || exactEntry(res.out, tgt);
    state.last = { src: src, tgt: tgt, text: input, out: res.out, via: res.via, code: lt.tts };
    $("fallback").hidden = true;
    $("r-source").textContent = res.via;
    $("r-pair").textContent = ls.short + " → " + lt.short + " · " + lt.label;
    var rt = $("r-text"); rt.textContent = res.out; rt.setAttribute("lang", lt.tts);
    if (lt.script === "han" || ls.script === "han") await ensurePinyin();
    fillRoman($("r-roman"), romanOf(res.out, tgt, entry));
    var srcEntry = res.entry || exactEntry(input, src);
    var ir = romanOf(input, src, srcEntry);
    $("r-input").textContent = ir && ir.text ? input + "  ·  " + ir.text : input;
    var w = $("words"); w.replaceChildren(); w.setAttribute("lang", lt.tts);
    segments(res.out, lt.tts).forEach(function (word) {
      var b = el("button", { type: "button", class: "word", "aria-label": "Écouter : " + word });
      b.appendChild(el("span", { class: "w-main", lang: lt.tts }, word));
      var wr = lt.script !== "latin" && settings.translit ? wordRoman(word, lt.script) : "";
      if (wr) b.appendChild(el("span", { class: "w-roman" }, wr));
      b.addEventListener("click", function () { b.classList.add("playing"); speak(word, lt.tts, 0.7, function () { b.classList.remove("playing"); }); });
      w.appendChild(b);
    });
    $("voice-info").textContent = voiceInfo(lt.tts);
    var card = $("result"); card.hidden = false; card.classList.remove("pop"); void card.offsetWidth; card.classList.add("pop");
    sparkle();
    addHisto(state.last);
    if (autoplay && settings.autoplay) speak(res.out, lt.tts);
  }
  function wordRoman(word, script) {
    if (script === "japanese") {
      if (word === "は") return "wa"; if (word === "へ") return "e";
      var j = TR.japanese(word); return /[a-zāīūēō]/i.test(j.text) && !j.partial ? j.text.toLowerCase() : "";
    }
    var r = TR.romanize(word, script);
    if (!r || !r.text || !/[a-z]/i.test(r.text)) return "";
    return script === "han" ? r.text.charAt(0).toLowerCase() + r.text.slice(1) : r.text;
  }
  function sparkle() {
    var s = $("sparkles"); s.replaceChildren();
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ["✨", "⭐", "💛", "💜", "🧡", "✨"].forEach(function (c, i) {
      var sp = el("span", { class: "sp" }, c);
      sp.style.setProperty("--dx", (Math.cos(i) * 90).toFixed(0) + "px");
      sp.style.setProperty("--dy", (-40 - (i % 3) * 25) + "px");
      s.appendChild(sp);
    });
    setTimeout(function () { s.replaceChildren(); }, 1100);
  }
  function showFallback(text) {
    $("result").hidden = true; $("fallback").hidden = false;
    var s = L(state.src), t = L(state.tgt);
    var code = function (l) { return l.id === "ptPT" ? "pt-PT" : l.id === "zh" ? "zh-CN" : l.mt; };
    $("gt-link").href = "https://translate.google.com/?sl=" + code(s) + "&tl=" + code(t) + "&text=" + encodeURIComponent(text) + "&op=translate";
  }

  var busy = false, again = null;
  async function doTranslate(autoplay) {
    var text = $("text").value.trim().slice(0, MAX_LEN);
    if (!text) { toast("Dites ou écrivez une phrase"); $("text").focus(); return; }
    if (busy) { again = !!autoplay || !!again; return; } /* relancé dès la fin de la traduction en cours */
    busy = true; $("go").disabled = true; $("go").textContent = "⏳ Traduction…"; document.body.classList.add("thinking");
    try {
      var res = await translate(text, state.src, state.tgt);
      if (res) await showResult(state.src, state.tgt, text, res, autoplay); else showFallback(text);
    } finally {
      busy = false; $("go").disabled = false; $("go").textContent = "✨ Traduire"; document.body.classList.remove("thinking");
      if (again !== null) { var a = again; again = null; doTranslate(a); }
    }
  }
  $("go").addEventListener("click", function () { primeAudio(); doTranslate(true); });
  $("text").addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); primeAudio(); doTranslate(true); } });
  $("clear").addEventListener("click", function () { $("text").value = ""; $("result").hidden = true; $("fallback").hidden = true; $("text").focus(); });
  $("speak").addEventListener("click", function () { if (state.last) speak(state.last.out, state.last.code); });
  $("slow").addEventListener("click", function () { if (state.last) speak(state.last.out, state.last.code, 0.6); });
  $("copy").addEventListener("click", async function () {
    if (!state.last) return;
    try { await navigator.clipboard.writeText(state.last.out); toast("Copié ✅"); } catch (e) { toast("Copie impossible ici"); }
  });
  $("fav").addEventListener("click", function () {
    var x = state.last; if (!x) return;
    if (favs.some(function (f) { return f.src === x.src && f.tgt === x.tgt && norm(f.text) === norm(x.text); })) { toast("Déjà dans vos favoris"); return; }
    favs.unshift({ src: x.src, tgt: x.tgt, text: x.text, out: x.out }); favs = favs.slice(0, 300); store.set("favs", favs);
    toast("⭐ Ajouté aux favoris (disponible hors ligne)");
  });
  $("reply").addEventListener("click", function () { primeAudio(); swap(false); $("text").value = ""; $("result").hidden = true; startMic(); });

  /* ---------- micro ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, listening = false;
  var IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document);
  var IOS_APP = IOS && (window.navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches));
  function srcName() { return L(state.src).label.replace(/ \(.*\)/, "").toLowerCase(); }
  function iosDictation() {
    var t = $("text"); t.value = ""; t.focus();
    toast("Touchez le 🎤 du clavier pour dicter en " + srcName() + ", puis ✨ Traduire");
    $("mic-info").textContent = "📱 iPhone : dictez avec le 🎤 du clavier (Réglages → Général → Clavier → activer la dictée et ajouter le clavier " + srcName() + ").";
  }
  function localSR() { return NATIVE ? !!NATIVE.onDeviceSpeech : !!(settings.localSR && settings.localSR[L(state.src).tts]); }
  async function probeLocal() {
    if (!SR || typeof SR.available !== "function") { toast("Reconnaissance hors ligne non proposée par ce navigateur"); return; }
    var code = L(state.src).tts, st;
    try {
      st = await SR.available({ langs: [code], processLocally: true });
      if ((st === "downloadable" || st === "downloading") && typeof SR.install === "function") {
        toast("Installation du micro hors ligne (" + code + ")…");
        st = (await SR.install({ langs: [code], processLocally: true })) ? "available" : st;
      }
    } catch (e) { st = "unavailable"; }
    settings.localSR = Object.assign({}, settings.localSR); settings.localSR[code] = st === "available"; saveSettings();
    updateMicInfo(); renderCaps();
    toast(L(state.src).label + " : " + (st === "available" ? "micro hors ligne ✅" : "micro en ligne seulement"));
  }
  function updateMicInfo() {
    if (IOS && !NATIVE && (IOS_APP || !SR)) { $("mic-info").textContent = "📱 iPhone : touchez 🎙️ puis le 🎤 du clavier pour dicter en " + srcName() + " (dictée Apple)."; return; }
    if (!SR && !NATIVE) { $("mic").disabled = true; $("mic-info").textContent = "Micro non pris en charge par ce navigateur : écrivez votre phrase (Chrome, Edge ou Safari conseillés)."; return; }
    $("mic-info").textContent = localSR() ? "🔒 Votre voix est reconnue sur l'appareil (privé, hors ligne)."
      : "ℹ️ Votre voix passe par le service en ligne du navigateur/téléphone. Aide → « Micro hors ligne » pour vérifier.";
  }
  function setListening(on) {
    listening = on; $("mic").setAttribute("aria-pressed", on ? "true" : "false");
    $("mic-label").textContent = on ? "J'écoute en " + srcName() + "… (touchez pour arrêter)" : "Appuyer et parler en " + srcName();
    document.body.classList.toggle("listening", on);
  }
  function startRec() {
    rec = new SR(); rec.lang = L(state.src).tts; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    if (localSR()) { try { rec.processLocally = true; } catch (e) { } }
    rec.onresult = function (ev) {
      var interim = "", fin = "";
      for (var i = 0; i < ev.results.length; i++) { var t = ev.results[i][0].transcript; if (ev.results[i].isFinal) fin += t; else interim += t; }
      $("text").value = (fin + interim).trim();
    };
    rec.onerror = function (ev) {
      if (IOS && ev.error !== "no-speech") { iosDictation(); return; }
      var m = { "not-allowed": "Micro refusé : autorisez-le dans les réglages du navigateur.", "service-not-allowed": "Micro indisponible ici : écrivez ou dictez avec le clavier.", "no-speech": "Je n'ai rien entendu, réessayez.", "network": "Pas de réseau pour la reconnaissance vocale : écrivez la phrase.", "language-not-supported": "Langue non prise en charge par le micro : dictez avec le clavier." };
      toast(m[ev.error] || "Micro : erreur (" + ev.error + ")");
    };
    rec.onend = function () { setListening(false); if ($("text").value.trim()) doTranslate(true); };
    $("text").value = ""; setListening(true);
    try { rec.start(); } catch (e) { setListening(false); }
  }
  function startNative() {
    var errs = { "not-allowed": "Micro refusé : autorisez-le dans les réglages Android.", "no-speech": "Je n'ai rien entendu, réessayez.",
      "network": "Reconnaissance vocale sans réseau indisponible : écrivez la phrase.", "language-unavailable": "Langue du micro non installée hors ligne (voir Aide).", "no-recognizer": "Aucun service de reconnaissance vocale sur ce téléphone." };
    listenHandler = function (ev) {
      if (ev.type === "partial" || ev.type === "final") $("text").value = ev.text;
      else if (ev.type === "error") toast(errs[ev.text] || "Micro : erreur (" + ev.text + ")");
      else if (ev.type === "info" && ev.text === "fallback") toast("Micro hors ligne non installé pour cette langue : micro classique utilisé");
      else if (ev.type === "end") { setListening(false); if ($("text").value.trim()) doTranslate(true); }
    };
    $("text").value = ""; setListening(true);
    window.BibiNative.listen(L(state.src).tts);
  }
  function startMic() {
    if (NATIVE) {
      if (listening) { window.BibiNative.stopListening(); return; }
      if (!NATIVE.onDeviceSpeech && !settings.micConsent) { openConsent(); return; }
      startNative(); return;
    }
    if (listening && rec) { rec.stop(); return; }
    if (IOS && (IOS_APP || !SR)) { iosDictation(); return; }
    if (!SR) { toast("Micro non pris en charge : écrivez la phrase"); return; }
    if (!localSR() && !settings.micConsent) { openConsent(); return; }
    startRec();
  }
  $("mic").addEventListener("click", function () { primeAudio(); startMic(); });
  function openConsent() {
    var m = $("consent"); m.hidden = false; $("c-ok").focus();
    var close = function () { m.hidden = true; $("mic").focus(); };
    $("c-ok").onclick = function () { settings.micConsent = true; saveSettings(); close(); if (NATIVE) startNative(); else startRec(); };
    $("c-no").onclick = function () { close(); $("text").focus(); };
    m.onkeydown = function (e) { if (e.key === "Escape") close(); };
  }

  /* ---------- vocabulaire ---------- */
  var curTheme = "salut";
  function phraseItem(srcText, srcId, outText, tgtId, entry, extra) {
    var li = el("li"), box = el("div"), ls = L(srcId), lt = L(tgtId);
    var sr = romanOf(srcText, srcId, entry), tr = romanOf(outText, tgtId, entry);
    box.appendChild(el("p", { class: "ph-src", lang: ls.tts }, srcText + (sr && sr.text ? "  ·  " + sr.text : "")));
    box.appendChild(el("p", { class: "ph-tgt", lang: lt.tts }, outText));
    if (tr && tr.text) box.appendChild(el("p", { class: "ph-roman" }, tr.text));
    if (extra) box.appendChild(el("p", { class: "hint" }, extra));
    var btns = el("div", { class: "ph-btns" });
    var p1 = el("button", { type: "button", class: "icon-btn", "aria-label": "Écouter en " + lt.label + " : " + outText, title: "Écouter (" + lt.short + ")" }, "🔊");
    p1.addEventListener("click", function () { primeAudio(); speak(outText, lt.tts); });
    var p0 = el("button", { type: "button", class: "icon-btn soft", "aria-label": "Écouter en " + ls.label + " : " + srcText, title: "Écouter (" + ls.short + ")" }, "🗣️");
    p0.addEventListener("click", function () { primeAudio(); speak(srcText, ls.tts); });
    btns.appendChild(p1); btns.appendChild(p0);
    li.appendChild(box); li.appendChild(btns);
    return { li: li, btns: btns };
  }
  async function renderVocab() {
    if (state.src === "zh" || state.tgt === "zh") await ensurePinyin();
    $("v-pair").textContent = L(state.src).label + " → " + L(state.tgt).label;
    var cats = $("themes"); cats.replaceChildren();
    THEMES.forEach(function (c) {
      var b = el("button", { type: "button", class: "cat", "aria-pressed": c.id === curTheme ? "true" : "false" }, c.label);
      b.addEventListener("click", function () { curTheme = c.id; $("v-search").value = ""; renderVocab(); });
      cats.appendChild(b);
    });
    var q = norm($("v-search").value || ""), ul = $("vocab"); ul.replaceChildren();
    var items = VOCAB.filter(function (v) {
      if (q) return LANGS.some(function (l) { return norm(v[l.id]).indexOf(q) >= 0; }) || (v.jaT && norm(v.jaT).indexOf(q) >= 0) || (v.zhT && norm(v.zhT).indexOf(q) >= 0);
      return v.theme === curTheme;
    });
    if (!items.length) { ul.appendChild(el("li", null, "Aucun résultat.")); return; }
    items.forEach(function (v) { ul.appendChild(phraseItem(v[state.src], state.src, v[state.tgt], state.tgt, v).li); });
  }
  $("v-search").addEventListener("input", function () { renderVocab(); });
  $("v-swap").addEventListener("click", function () { swap(false); renderVocab(); });

  /* ---------- favoris ---------- */
  function renderFavs() {
    var ul = $("favs"); ul.replaceChildren();
    if (!favs.length) { ul.appendChild(el("li", null, "Aucun favori. Après une traduction, touchez « ⭐ Favori »")); return; }
    favs.forEach(function (f) {
      var it = phraseItem(f.text, f.src, f.out, f.tgt, null, L(f.src).short + " → " + L(f.tgt).short);
      var del = el("button", { type: "button", class: "icon-btn soft", "aria-label": "Supprimer ce favori" }, "🗑️");
      del.addEventListener("click", function () { favs = favs.filter(function (x) { return x !== f; }); store.set("favs", favs); renderFavs(); });
      it.btns.appendChild(del); ul.appendChild(it.li);
    });
  }

  /* ---------- historique ---------- */
  function addHisto(item) {
    if (!settings.keepHisto) return;
    history.unshift({ src: item.src, tgt: item.tgt, text: item.text, out: item.out, t: Date.now() });
    history = history.slice(0, 50); store.set("history", history);
  }
  function renderHisto() {
    $("keep-histo").checked = settings.keepHisto;
    var ul = $("histo"); ul.replaceChildren();
    if (!history.length) { ul.appendChild(el("li", null, "Aucune traduction pour l'instant.")); return; }
    history.forEach(function (h) {
      if (!h.src || !LANGS.some(function (l) { return l.id === h.src; })) return;
      ul.appendChild(phraseItem(h.text, h.src, h.out, h.tgt, null, L(h.src).short + " → " + L(h.tgt).short + " · " + new Date(h.t).toLocaleString("fr-FR")).li);
    });
  }
  $("keep-histo").addEventListener("change", function (e) { settings.keepHisto = e.target.checked; saveSettings(); });
  $("clear-histo").addEventListener("click", function () { history = []; store.set("history", history); renderHisto(); toast("Historique effacé"); });

  /* ---------- voix par langue ---------- */
  var SAMPLE = { fr: "Bonjour, je m'appelle Bibi.", ro: "Bună ziua, mă numesc Bibi.", en: "Hello, my name is Bibi.", ptBR: "Olá, meu nome é Bibi.", ptPT: "Olá, chamo-me Bibi.",
    it: "Buongiorno, mi chiamo Bibi.", esES: "Buenos días, me llamo Bibi.", esMX: "Buenos días, me llamo Bibi.", esAR: "Buen día, me llamo Bibi.", el: "Καλημέρα, με λένε Μπίμπι.",
    de: "Guten Tag, ich heiße Bibi.", ru: "Здравствуйте, меня зовут Биби.", ja: "こんにちは、ビビです。", zh: "你好，我叫比比。", nl: "Goedendag, ik heet Bibi." };
  function renderVoices() {
    var ul = $("voices"); ul.replaceChildren();
    LANGS.forEach(function (l) {
      var li = el("li"), lab = el("label", { for: "v-" + l.id }, l.label + " (" + l.tts + ")");
      li.appendChild(lab);
      var row = el("div", { class: "row" });
      if (NATIVE) {
        row.appendChild(el("span", { class: "hint" }, window.BibiNative.hasVoice(l.tts) ? "✅ Voix installée sur le téléphone" : "⚠️ Voix absente : Réglages des voix"));
      } else {
        var s = el("select", { id: "v-" + l.id }), ranked = rankVoices(l.tts);
        s.appendChild(el("option", { value: "" }, ranked.length ? "Automatique : " + ranked[0].v.name : "Aucune voix " + l.tts + " installée"));
        ranked.forEach(function (r) { s.appendChild(el("option", { value: r.v.voiceURI }, r.v.name + " · " + r.v.lang + (r.v.localService ? " · hors ligne" : " · en ligne"))); });
        s.value = settings.voices[l.tts] || "";
        s.addEventListener("change", function () { if (s.value) settings.voices[l.tts] = s.value; else delete settings.voices[l.tts]; saveSettings(); });
        row.appendChild(s);
      }
      var t = el("button", { type: "button", class: "icon-btn", "aria-label": "Tester la voix " + l.label }, "🔊");
      t.addEventListener("click", function () { primeAudio(); speak(SAMPLE[l.id], l.tts); });
      row.appendChild(t); li.appendChild(row); ul.appendChild(li);
    });
  }

  /* ---------- réglages ---------- */
  $("set-auto").checked = settings.autoplay;
  $("set-auto").addEventListener("change", function (e) { settings.autoplay = e.target.checked; saveSettings(); });
  $("set-translit").checked = settings.translit;
  $("set-translit").addEventListener("change", function (e) { settings.translit = e.target.checked; saveSettings(); });
  $("set-online").checked = settings.online;
  $("set-online").addEventListener("change", function (e) { settings.online = e.target.checked; saveSettings(); toast(settings.online ? "Traduction en ligne activée" : "Traduction en ligne désactivée"); });
  $("set-rate").value = String(settings.rate);
  $("set-rate").addEventListener("change", function (e) { settings.rate = parseFloat(e.target.value) || 0.95; saveSettings(); });
  $("probe-sr").addEventListener("click", function () { if (NATIVE) { toast(NATIVE.onDeviceSpeech ? "Micro sur le téléphone ✅" : "Micro via le service Google du téléphone"); return; } probeLocal(); });
  if (NATIVE) {
    $("native-box").hidden = false;
    $("dl-all").addEventListener("click", async function () {
      var b = $("dl-all"); b.disabled = true;
      var r = await nativeCall(function (id) { window.BibiNative.downloadAll(id, $("wifi-only").checked); },
        function (p) { $("dl-status").textContent = "Téléchargement des langues : " + p; });
      b.disabled = false;
      $("dl-status").textContent = r.ok ? "✅ Toutes les langues sont prêtes hors ligne." : "⚠️ " + r.data + " langue(s) non téléchargée(s). Réessayez avec internet.";
      store.set("langsReady", r.ok);
    });
    $("voice-settings").addEventListener("click", function () { window.BibiNative.openVoiceSettings(); });
  }
  $("go-online").addEventListener("click", function () {
    settings.online = true; saveSettings(); $("set-online").checked = true;
    if (!navigator.onLine) { toast("Pas de connexion : connectez-vous au Wi-Fi ou aux données mobiles"); return; }
    primeAudio(); doTranslate(true);
  });
  $("forget-mic").addEventListener("click", function () { settings.micConsent = false; saveSettings(); toast("Accord micro retiré"); });

  function renderCaps() {
    var ul = $("caps"); ul.replaceChildren();
    var add = function (ok, txt) { ul.appendChild(el("li", null, (ok ? "✅ " : "⚠️ ") + txt)); };
    add(true, "Vocabulaire (" + VOCAB.length + " phrases × 15 langues), favoris, historique : toujours hors ligne");
    if (NATIVE) add(true, "Application Android : traduction de toute phrase hors ligne entre les 15 langues (langues téléchargées)");
    else add(hasDeviceMT(), hasDeviceMT() ? "Traducteur intégré à l'appareil : présent (toute phrase, hors ligne)" : "Pas de traducteur intégré (normal sur téléphone/Safari) : vocabulaire, ou traduction en ligne si vous l'activez");
    if (NATIVE) add(true, NATIVE.onDeviceSpeech ? "Micro : reconnaissance sur le téléphone" : "Micro : service de reconnaissance du téléphone");
    else add(!!SR, SR ? (localSR() ? "Micro : reconnaissance sur l'appareil" : "Micro : reconnaissance via le service en ligne du navigateur") : "Micro non pris en charge : écrire la phrase ou dicter au clavier");
    add(true, "Translittération grec, russe, japonais (kana) : intégrée, hors ligne");
    add(pinyinState === "ok" || !!self.pinyinPro, pinyinState === "ok" || self.pinyinPro ? "Pinyin du chinois : prêt, hors ligne" : "Pinyin du chinois : chargé à la première phrase chinoise");
    var missing = LANGS.filter(function (l) { return NATIVE ? !window.BibiNative.hasVoice(l.tts) : !pickVoice(l.tts); }).map(function (l) { return l.short; });
    add(!missing.length, missing.length ? "Voix à installer : " + missing.join(", ") : "Une voix est présente pour chaque langue");
  }

  /* ---------- démarrage ---------- */
  $("ver").textContent = VERSION + (NATIVE ? " · Android " + NATIVE.version : "");
  syncLangs();
  if (NATIVE && !store.get("langsReady", false)) setTimeout(function () { toast("Première utilisation : Aide → « Télécharger toutes les langues »"); }, 1500);
  if (!NATIVE && "serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").then(function (r) { r.update(); }).catch(function () { });
    var reloaded = false, hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", function () { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
  }
  window.__bibi = { translate: translate, romanOf: romanOf, rankVoices: rankVoices, state: state, version: VERSION };
})();
