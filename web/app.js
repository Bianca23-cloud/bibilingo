/* Bibilingo – traduction automatique. Code original, sans dépendance externe. */
"use strict";
(function () {
  var VERSION = "1.0.2";
  var $ = function (id) { return document.getElementById(id); };
  var LANGS = window.BIBI_LANGS, PHRASES = window.BIBI_PHRASES, CATS = window.BIBI_CATS;
  var SRC_TTS = { ro: "ro-RO", fr: "fr-FR" };
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

  /* ---------- stockage local (protégé) ---------- */
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem("bibi." + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("bibi." + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  };
  var settings = Object.assign({ autoplay: true, online: false, rate: 0.95, keepHisto: true, micConsent: false },
    store.get("settings", {}));
  function saveSettings() { store.set("settings", settings); }
  var state = { src: store.get("src", "ro"), tgt: store.get("tgt", "en"), last: null, speaking: false };
  var history = store.get("history", []);
  var favs = store.get("favs", []);

  function langById(id) { for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === id) return LANGS[i]; return LANGS[0]; }
  function toast(msg) { var t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove("show"); }, 2200); }
  function el(tag, attrs, text) { var e = document.createElement(tag); if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; }

  /* ---------- onglets ---------- */
  function showTab(id) {
    document.querySelectorAll(".panel").forEach(function (p) { p.hidden = p.id !== id; });
    document.querySelectorAll(".tab").forEach(function (b) {
      if (b.dataset.tab === id) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    if (id === "p-guide") renderGuide();
    if (id === "p-histo") renderHisto();
    if (id === "p-aide") renderCaps();
  }
  document.querySelectorAll(".tab").forEach(function (b) { b.addEventListener("click", function () { showTab(b.dataset.tab); }); });
  document.addEventListener("click", function (e) { var g = e.target.closest("[data-goto]"); if (g) showTab(g.dataset.goto); });

  /* ---------- langues ---------- */
  var sel = $("target");
  LANGS.forEach(function (l) { sel.appendChild(el("option", { value: l.id }, l.label)); });
  sel.value = state.tgt;
  sel.addEventListener("change", function () { state.tgt = sel.value; store.set("tgt", state.tgt); if ($("text").value.trim()) doTranslate(false); });
  document.querySelectorAll('input[name="src"]').forEach(function (r) {
    r.checked = r.value === state.src;
    r.addEventListener("change", function () { state.src = r.value; store.set("src", state.src); updateMicInfo(); });
  });

  /* ---------- réseau ---------- */
  function updateNet() {
    var on = navigator.onLine;
    var s = el("span", on ? null : { class: "off" }, on ? "🟢 En ligne" : "🟠 Hors ligne : favoris, audio et traducteur de l'appareil");
    $("net").replaceChildren(s);
  }
  window.addEventListener("online", updateNet); window.addEventListener("offline", updateNet); updateNet();

  /* ---------- 1) favoris : correspondance quasi exacte ---------- */
  function norm(s) {
    return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/[’']/g, " ").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  }
  function bigrams(s) { var a = [], t = s.replace(/ /g, ""); for (var i = 0; i < t.length - 1; i++) a.push(t.slice(i, i + 2)); return a; }
  function dice(a, b) {
    if (a === b) return 1; var x = bigrams(a), y = bigrams(b); if (!x.length || !y.length) return 0;
    var m = {}, hit = 0; x.forEach(function (g) { m[g] = (m[g] || 0) + 1; });
    y.forEach(function (g) { if (m[g] > 0) { m[g]--; hit++; } });
    return (2 * hit) / (x.length + y.length);
  }
  function findFavorite(text, src, tgt) {
    var n = norm(text); if (!n) return null; var best = null, score = 0;
    PHRASES.forEach(function (p) { var s = dice(n, norm(p[src])); if (s > score) { score = s; best = p[tgt]; } });
    favs.forEach(function (f) { if (f.src === src && f.tgt === tgt) { var s = dice(n, norm(f.text)); if (s > score) { score = s; best = f.out; } } });
    return score >= 0.9 ? best : null; /* seuil élevé : jamais de « presque bonne » phrase */
  }

  /* ---------- 2) traducteur intégré à l'appareil (Chrome/Edge sur ordinateur) ---------- */
  var translators = {};
  function withTimeout(promise, ms) {
    return Promise.race([promise, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]);
  }
  function hasDeviceMT() { return !!NATIVE || typeof self.Translator !== "undefined"; }
  async function deviceTranslate(text, src, mt) {
    if (NATIVE) {
      try {
        var r = await withTimeout(nativeCall(function (id) { window.BibiNative.translate(id, text, src, mt); }), 90000);
        if (r.ok) return r.data;
        if (r.data === "model-missing") toast("Langue non téléchargée : Aide → « Télécharger toutes les langues » (avec internet)");
      } catch (e) { }
      return null;
    }
    if (!hasDeviceMT()) return null;
    var key = src + ">" + mt;
    try {
      if (!translators[key]) {
        var av = await withTimeout(self.Translator.availability({ sourceLanguage: src, targetLanguage: mt }), 5000);
        if (av === "unavailable") return null;
        if (av !== "available") toast("Téléchargement du modèle " + src + " → " + mt + " (une seule fois)…");
        translators[key] = await withTimeout(self.Translator.create({ sourceLanguage: src, targetLanguage: mt }), av === "available" ? 15000 : 120000);
      }
      return await withTimeout(translators[key].translate(text), 15000);
    } catch (e) { delete translators[key]; return null; }
  }

  /* ---------- 3) en ligne (désactivé par défaut, accord explicite) ---------- */
  async function onlineTranslate(text, src, lang) {
    if (!settings.online || !navigator.onLine) return null;
    var url = "https://api.mymemory.translated.net/get?q=" + encodeURIComponent(text) +
      "&langpair=" + encodeURIComponent(SRC_TTS[src] + "|" + lang.tts);
    try {
      var ctrl = new AbortController(); var to = setTimeout(function () { ctrl.abort(); }, 8000);
      var r = await fetch(url, { signal: ctrl.signal, credentials: "omit", referrerPolicy: "no-referrer" });
      clearTimeout(to);
      if (!r.ok) return null; var j = await r.json();
      var out = j && j.responseData && j.responseData.translatedText;
      if (!out || /MYMEMORY WARNING|INVALID/i.test(out)) return null;
      return String(out);
    } catch (e) { return null; }
  }

  async function translate(text, src, tgtId) {
    var lang = langById(tgtId);
    if (lang.mt === src) return { out: text, via: "Même langue" };
    var f = findFavorite(text, src, tgtId); if (f) return { out: f, via: "⭐ Favori vérifié · hors ligne" };
    var d = await deviceTranslate(text, src, lang.mt); if (d) return { out: d, via: (NATIVE ? "📱 Traduit sur l'appareil · hors ligne · traduction Google ML Kit" : "💻 Traduit sur l'appareil · hors ligne") };
    var o = await onlineTranslate(text, src, lang); if (o) return { out: o, via: "🌐 Traduit en ligne (MyMemory)" };
    return null;
  }

  /* ---------- voix (synthèse) ---------- */
  var synth = window.speechSynthesis, voices = [];
  function loadVoices() { voices = synth ? synth.getVoices() : []; }
  if (synth) { loadVoices(); synth.addEventListener && synth.addEventListener("voiceschanged", loadVoices); }
  function pickVoice(code) {
    var c = code.toLowerCase(), pre = c.split("-")[0];
    var norm2 = function (v) { return v.lang.replace("_", "-").toLowerCase(); };
    var exact = voices.filter(function (v) { return norm2(v) === c; });
    var near = voices.filter(function (v) { return norm2(v).split("-")[0] === pre; });
    var list = exact.length ? exact : near;
    return list.filter(function (v) { return v.localService; })[0] || list[0] || null;
  }
  function speak(text, code, rate, onEnd) {
    if (NATIVE) {
      window.BibiNative.speak(text, code, rate || settings.rate);
      if (onEnd) setTimeout(onEnd, 400 + text.length * 70);
      return;
    }
    if (!synth) { toast("Audio indisponible sur ce navigateur"); return; }
    synth.cancel();
    var u = new SpeechSynthesisUtterance(text); u.lang = code; u.rate = rate || settings.rate;
    var v = pickVoice(code); if (v) u.voice = v;
    u.onend = u.onerror = function () { document.body.classList.remove("speaking"); if (onEnd) onEnd(); };
    document.body.classList.add("speaking"); synth.speak(u);
  }
  function primeAudio() { /* iPhone : débloque l'audio pendant le geste de l'utilisateur */
    if (synth && !primeAudio.done) { try { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u); } catch (e) { } primeAudio.done = true; }
  }
  function voiceInfo(code) {
    if (NATIVE) return window.BibiNative.hasVoice(code) ? "Voix « " + code + " » installée · fonctionne hors ligne"
      : "Voix « " + code + " » absente : Aide → « Réglages des voix » pour l'installer.";
    var v = pickVoice(code);
    if (!v) return "Aucune voix « " + code + " » sur cet appareil : installez-la (voir Aide).";
    return "Voix : " + v.name + (v.localService ? " · fonctionne hors ligne" : " · voix en ligne");
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
  function showResult(src, tgtId, input, res, autoplay) {
    var lang = langById(tgtId);
    state.last = { src: src, tgt: tgtId, text: input, out: res.out, via: res.via, code: lang.tts };
    $("fallback").hidden = true;
    $("r-source").textContent = res.via + " · " + lang.label;
    var rt = $("r-text"); rt.textContent = res.out; rt.setAttribute("lang", lang.tts);
    var w = $("words"); w.replaceChildren(); w.setAttribute("lang", lang.tts);
    segments(res.out, lang.tts).forEach(function (word) {
      var b = el("button", { type: "button", class: "word", "aria-label": "Écouter : " + word }, word);
      b.addEventListener("click", function () { b.classList.add("playing"); speak(word, lang.tts, 0.7, function () { b.classList.remove("playing"); }); });
      w.appendChild(b);
    });
    $("voice-info").textContent = voiceInfo(lang.tts);
    $("result").hidden = false;
    addHisto(state.last);
    if (autoplay && settings.autoplay) speak(res.out, lang.tts);
  }
  function showFallback(text) {
    $("result").hidden = true; $("fallback").hidden = false;
    var l = langById(state.tgt);
    $("gt-link").href = "https://translate.google.com/?sl=" + state.src + "&tl=" + (l.id === "ptPT" ? "pt-PT" : l.mt) +
      "&text=" + encodeURIComponent(text) + "&op=translate";
  }

  var busy = false;
  async function doTranslate(autoplay) {
    var text = $("text").value.trim().slice(0, MAX_LEN);
    if (!text) { toast("Dites ou écrivez une phrase"); $("text").focus(); return; }
    if (busy) return; busy = true; $("go").disabled = true; $("go").textContent = "⏳ Traduction…";
    try {
      var res = await translate(text, state.src, state.tgt);
      if (res) showResult(state.src, state.tgt, text, res, autoplay); else showFallback(text);
    } finally { busy = false; $("go").disabled = false; $("go").textContent = "✨ Traduire"; }
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
    var L = state.last; if (!L) return;
    if (favs.some(function (f) { return f.src === L.src && f.tgt === L.tgt && norm(f.text) === norm(L.text); })) { toast("Déjà dans vos favoris"); return; }
    favs.unshift({ src: L.src, tgt: L.tgt, text: L.text, out: L.out }); favs = favs.slice(0, 200); store.set("favs", favs);
    toast("⭐ Ajouté aux favoris (disponible hors ligne)");
  });

  /* ---------- micro (reconnaissance vocale) ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, listening = false, localMode = false;
  var IOS = /iPhone|iPad|iPod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && "ontouchend" in document);
  var IOS_APP = IOS && (window.navigator.standalone === true || (window.matchMedia && matchMedia("(display-mode: standalone)").matches));
  /* iPhone : le micro web est bloqué dans les applis installées → dictée du clavier (🎤 Apple, aussi hors ligne). */
  function iosDictation(reason) {
    var t = $("text"); t.value = ""; t.focus();
    toast("Touchez le 🎤 du clavier pour dicter" + (state.src === "ro" ? " (clavier roumain)" : " (clavier français)") + ", puis ✨ Traduire");
    $("mic-info").textContent = "📱 iPhone : dictez avec le 🎤 du clavier (Réglages → Général → Clavier → activer la dictée et ajouter le clavier " + (state.src === "ro" ? "roumain" : "français") + ")." + (reason ? " " + reason : "");
  }
  /* Vérification « sur l'appareil » seulement sur demande (bouton Réglages) : plus sûr au démarrage. */
  function checkLocal(lang) {
    if (NATIVE) { localMode = !!NATIVE.onDeviceSpeech; return localMode; }
    localMode = !!(settings.localSR && settings.localSR[lang]); return localMode;
  }
  async function probeLocal() {
    if (!SR || typeof SR.available !== "function") { toast("Reconnaissance hors ligne non proposée par ce navigateur"); return; }
    var res = {}, langs = ["ro-RO", "fr-FR"];
    for (var i = 0; i < langs.length; i++) {
      try {
        var st = await SR.available({ langs: [langs[i]], processLocally: true });
        if ((st === "downloadable" || st === "downloading") && typeof SR.install === "function") {
          toast("Installation de la voix " + langs[i] + " hors ligne…");
          var ok = await SR.install({ langs: [langs[i]], processLocally: true }); st = ok ? "available" : st;
        }
        res[langs[i]] = st === "available";
      } catch (e) { res[langs[i]] = false; }
    }
    settings.localSR = res; saveSettings(); updateMicInfo(); renderCaps();
    toast("Roumain : " + (res["ro-RO"] ? "hors ligne ✅" : "en ligne") + " · Français : " + (res["fr-FR"] ? "hors ligne ✅" : "en ligne"));
  }
  function updateMicInfo() {
    if (IOS && !NATIVE && (IOS_APP || !SR)) { $("mic-info").textContent = "📱 iPhone : touchez 🎙️ puis le 🎤 du clavier pour dicter (dictée Apple, aussi hors ligne si la langue est téléchargée)."; return; }
    if (!SR && !NATIVE) { $("mic").disabled = true; $("mic-info").textContent = "Micro non pris en charge par ce navigateur : écrivez votre phrase (Chrome, Edge ou Safari conseillés)."; return; }
    var loc = checkLocal(SRC_TTS[state.src]);
    $("mic-info").textContent = loc ? "🔒 Reconnaissance de la voix sur l'appareil (privée, hors ligne)."
      : "ℹ️ La voix passe par le service en ligne du navigateur. Réglages → « Micro hors ligne » pour vérifier.";
  }
  function setListening(on) {
    listening = on; $("mic").setAttribute("aria-pressed", on ? "true" : "false");
    $("mic-label").textContent = on ? "J'écoute… (touchez pour arrêter)" : "Appuyer et parler";
    document.body.classList.toggle("listening", on);
  }
  function startRec() {
    var lang = SRC_TTS[state.src];
    rec = new SR(); rec.lang = lang; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
    if (localMode) { try { rec.processLocally = true; } catch (e) { } }
    var finalText = "";
    rec.onresult = function (ev) {
      var interim = ""; finalText = "";
      for (var i = 0; i < ev.results.length; i++) { var t = ev.results[i][0].transcript; if (ev.results[i].isFinal) finalText += t; else interim += t; }
      $("text").value = (finalText + interim).trim();
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
      else if (ev.type === "end") { setListening(false); if ($("text").value.trim()) doTranslate(true); }
    };
    $("text").value = ""; setListening(true);
    window.BibiNative.listen(SRC_TTS[state.src]);
  }
  $("mic").addEventListener("click", async function () {
    primeAudio();
    if (NATIVE) {
      if (listening) { window.BibiNative.stopListening(); return; }
      if (!NATIVE.onDeviceSpeech && !settings.micConsent) { openConsent(); return; }
      startNative(); return;
    }
    if (listening && rec) { rec.stop(); return; }
    if (IOS && (IOS_APP || !SR)) { iosDictation(); return; }
    checkLocal(SRC_TTS[state.src]);
    if (!localMode && !settings.micConsent) { openConsent(); return; }
    startRec();
  });
  function openConsent() {
    var m = $("consent"); m.hidden = false; $("c-ok").focus();
    var close = function () { m.hidden = true; $("mic").focus(); };
    $("c-ok").onclick = function () { settings.micConsent = true; saveSettings(); close(); if (NATIVE) startNative(); else startRec(); };
    $("c-no").onclick = function () { close(); $("text").focus(); };
    m.onkeydown = function (e) { if (e.key === "Escape") close(); };
  }

  /* ---------- favoris / guide ---------- */
  var curCat = "mine";
  function renderGuide() {
    var lang = langById(state.tgt); $("g-lang").textContent = lang.label;
    var cats = $("cats"); cats.replaceChildren();
    [{ id: "mine", label: "⭐ Mes favoris" }].concat(CATS).forEach(function (c) {
      var b = el("button", { type: "button", class: "cat", "aria-pressed": c.id === curCat ? "true" : "false" }, c.label);
      b.addEventListener("click", function () { curCat = c.id; renderGuide(); });
      cats.appendChild(b);
    });
    var ul = $("phrases"); ul.replaceChildren();
    var items = curCat === "mine"
      ? favs.filter(function (f) { return f.tgt === state.tgt; }).map(function (f, i) { return { src: f.text, out: f.out, mine: f }; })
      : PHRASES.filter(function (p) { return p.cat === curCat; }).map(function (p) { return { src: p[state.src], out: p[state.tgt] }; });
    if (!items.length) { ul.appendChild(el("li", null, curCat === "mine" ? "Aucun favori pour cette langue. Après une traduction, touchez « ⭐ Favori »." : "—")); return; }
    items.forEach(function (it) {
      var li = el("li"); var box = el("div");
      box.appendChild(el("p", { class: "ph-src", lang: SRC_TTS[state.src] }, it.src));
      box.appendChild(el("p", { class: "ph-tgt", lang: lang.tts }, it.out));
      var btns = el("div", { class: "ph-btns" });
      var play = el("button", { type: "button", class: "icon-btn", "aria-label": "Écouter : " + it.out }, "🔊");
      play.addEventListener("click", function () { speak(it.out, lang.tts); });
      btns.appendChild(play);
      if (it.mine) {
        var del = el("button", { type: "button", class: "icon-btn", "aria-label": "Supprimer ce favori" }, "🗑️");
        del.addEventListener("click", function () { favs = favs.filter(function (f) { return f !== it.mine; }); store.set("favs", favs); renderGuide(); });
        btns.appendChild(del);
      }
      li.appendChild(box); li.appendChild(btns); ul.appendChild(li);
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
      var lang = langById(h.tgt), li = el("li"), box = el("div");
      box.appendChild(el("p", { class: "ph-src", lang: SRC_TTS[h.src] }, h.text));
      box.appendChild(el("p", { class: "ph-tgt", lang: lang.tts }, h.out));
      box.appendChild(el("p", { class: "hint" }, lang.label + " · " + new Date(h.t).toLocaleString("fr-FR")));
      var play = el("button", { type: "button", class: "icon-btn", "aria-label": "Écouter : " + h.out }, "🔊");
      play.addEventListener("click", function () { speak(h.out, lang.tts); });
      li.appendChild(box); li.appendChild(play); ul.appendChild(li);
    });
  }
  $("keep-histo").addEventListener("change", function (e) { settings.keepHisto = e.target.checked; saveSettings(); });
  $("clear-histo").addEventListener("click", function () { history = []; store.set("history", history); renderHisto(); toast("Historique effacé"); });

  /* ---------- réglages ---------- */
  $("set-auto").checked = settings.autoplay;
  $("set-auto").addEventListener("change", function (e) { settings.autoplay = e.target.checked; saveSettings(); });
  $("set-online").checked = settings.online;
  $("set-online").addEventListener("change", function (e) { settings.online = e.target.checked; saveSettings(); toast(settings.online ? "Traduction en ligne activée" : "Traduction en ligne désactivée"); });
  $("set-rate").value = String(settings.rate);
  $("set-rate").addEventListener("change", function (e) { settings.rate = parseFloat(e.target.value) || 0.95; saveSettings(); });
  $("probe-sr").addEventListener("click", function () { if (NATIVE) { toast(NATIVE.onDeviceSpeech ? "Micro sur l'appareil ✅" : "Micro via le service Google du téléphone"); return; } probeLocal(); });
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
    add(true, "Favoris et 30 phrases métier : toujours hors ligne");
    if (NATIVE) add(true, "Application Android : traduction de toute phrase hors ligne (langues téléchargées)");
    else add(hasDeviceMT(), hasDeviceMT() ? "Traducteur intégré à l'appareil : présent (toute phrase, hors ligne)" : "Pas de traducteur intégré (normal sur téléphone) : favoris, ou traduction en ligne si vous l'activez");
    if (NATIVE) add(true, NATIVE.onDeviceSpeech ? "Micro : reconnaissance sur le téléphone (hors ligne)" : "Micro : service de reconnaissance du téléphone (hors ligne si le pack de langue Google est installé)");
    else add(!!SR, SR ? (localMode ? "Micro : reconnaissance sur l'appareil" : "Micro : reconnaissance via le service en ligne du navigateur") : "Micro non pris en charge : écrire la phrase");
    var missing = LANGS.filter(function (l) { return NATIVE ? !window.BibiNative.hasVoice(l.tts) : !pickVoice(l.tts); }).map(function (l) { return l.label; });
    add(!missing.length, missing.length ? "Voix à installer : " + missing.join(", ") : "Toutes les voix sont présentes");
  }

  /* ---------- démarrage ---------- */
  $("ver").textContent = VERSION;
  updateMicInfo();
  if (NATIVE && !store.get("langsReady", false)) {
    setTimeout(function () { toast("Première utilisation : Aide → « Télécharger toutes les langues »"); }, 1500);
  }
  if (!NATIVE && "serviceWorker" in navigator && location.protocol !== "file:") {
    navigator.serviceWorker.register("sw.js").then(function (r) { r.update(); }).catch(function () { });
    var reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () { if (!reloaded) { reloaded = true; location.reload(); } });
  }
})();
