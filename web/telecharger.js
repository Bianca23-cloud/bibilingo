"use strict";
(function () {
  var ua = navigator.userAgent, os = /Android/i.test(ua) ? "android" : /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document) ? "iphone" : /Macintosh|Linux/i.test(ua) ? "mac" : "windows";
  var names = { android: "Android", iphone: "iPhone / iPad", windows: "ordinateur Windows", mac: "Mac ou Linux" };
  document.getElementById("detect").textContent = "Appareil détecté : " + names[os] + ". Votre section est en premier.";
  var card = document.getElementById("c-" + os); card.parentNode.insertBefore(card, document.getElementById("c-android"));
  card.classList.add("mine");
  var url = location.href.replace(/[?#].*$/, "");
  document.getElementById("share-url").textContent = url;
  var t = document.getElementById("toast");
  document.getElementById("copy-link").addEventListener("click", async function () {
    try { await navigator.clipboard.writeText(url); t.textContent = "Lien copié ✅"; } catch (e) { t.textContent = url; }
    t.classList.add("show"); setTimeout(function () { t.classList.remove("show"); }, 2500);
  });
  var deferred = null, btn = document.getElementById("install");
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; btn.hidden = false; });
  btn.addEventListener("click", async function () { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; btn.hidden = true; });
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(function () { });
})();
