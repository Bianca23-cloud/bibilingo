/* Bibilingo – fonctionnement hors ligne (cache de l'application). */
"use strict";
const CACHE = "bibilingo-v2.0.0";
const FILES = ["./", "index.html", "styles.css", "app.js", "vocab.js", "translit.js", "privacy.html", "telecharger.html", "telecharger.js",
  "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES).then(() => c.add("vendor/pinyin-pro.js").catch(() => { /* module pinyin facultatif */ }))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return; /* jamais de cache pour les services externes */
  /* Réseau d'abord (toujours la dernière version), copie hors ligne si pas de réseau. */
  e.respondWith(fetch(e.request).then(res => {
    if (res.ok && res.type === "basic") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match("index.html"))));
});
