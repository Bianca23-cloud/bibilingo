/* Bibilingo 2.0 – translittération en alphabet latin (grec, russe, japonais kana, chinois via pinyin-pro). */
"use strict";
var BibiTranslit = (function () {
  function keepCase(src, out) {
    if (!out) return out;
    if (src !== src.toLowerCase() && src === src.toUpperCase() && src.length > 1) return out.toUpperCase();
    if (src.charAt(0) !== src.charAt(0).toLowerCase()) return out.charAt(0).toUpperCase() + out.slice(1);
    return out;
  }

  /* ---------- Grec (ELOT 743 simplifié) ---------- */
  var GR = { "α":"a","β":"v","γ":"g","δ":"d","ε":"e","ζ":"z","η":"i","θ":"th","ι":"i","κ":"k","λ":"l","μ":"m","ν":"n","ξ":"x","ο":"o","π":"p","ρ":"r","σ":"s","ς":"s","τ":"t","υ":"y","φ":"f","χ":"ch","ψ":"ps","ω":"o",";":"?","·":";" };
  var GR_VOICELESS = "θκξπσςτφχψ";
  function greek(text) {
    var out = "", s = text.normalize("NFD"), chars = [], marks = [];
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (/[\u0300-\u036f]/.test(c)) { if (chars.length) marks[chars.length - 1] = (marks[chars.length - 1] || "") + c; continue; }
      chars.push(c);
    }
    for (var j = 0; j < chars.length; j++) {
      var ch = chars[j], lo = ch.toLowerCase(), nx = (chars[j + 1] || "").toLowerCase(), nn = (chars[j + 2] || "").toLowerCase();
      var diaer = /\u0308/.test(marks[j + 1] || "");
      var prevL = j > 0 && /\p{L}/u.test(chars[j - 1]);
      var pair = lo + nx, r = null, used = 1;
      if (!diaer) {
        if (pair === "ου") { r = "ou"; used = 2; }
        else if (pair === "αυ" || pair === "ευ" || pair === "ηυ") { r = GR[lo] + (nn && GR_VOICELESS.indexOf(nn) >= 0 || !/\p{L}/u.test(nn || " ") ? "f" : "v"); used = 2; }
        else if (pair === "γγ") { r = "ng"; used = 2; }
        else if (pair === "γξ") { r = "nx"; used = 2; }
        else if (pair === "γχ") { r = "nch"; used = 2; }
        else if (pair === "μπ") { r = prevL ? "mb" : "b"; used = 2; }
        else if (pair === "ντ") { r = prevL ? "nt" : "d"; used = 2; }
        else if (pair === "γκ") { r = prevL ? "ng" : "g"; used = 2; }
      }
      if (r === null) r = GR[lo] !== undefined ? GR[lo] : ch;
      out += keepCase(chars.slice(j, j + used).join(""), r);
      j += used - 1;
    }
    return out;
  }

  /* ---------- Russe (translittération pratique) ---------- */
  var RU = { "а":"a","б":"b","в":"v","г":"g","д":"d","е":"e","ё":"yo","ж":"zh","з":"z","и":"i","й":"y","к":"k","л":"l","м":"m","н":"n","о":"o","п":"p","р":"r","с":"s","т":"t","у":"u","ф":"f","х":"kh","ц":"ts","ч":"ch","ш":"sh","щ":"shch","ъ":"","ы":"y","ь":"’","э":"e","ю":"yu","я":"ya" };
  var RU_VOW = "аеёиоуыэюяъь";
  function russian(text) {
    var out = "";
    for (var i = 0; i < text.length; i++) {
      var ch = text[i], lo = ch.toLowerCase(), r = RU[lo];
      if (r === undefined) { out += ch; continue; }
      var prev = (text[i - 1] || "").toLowerCase();
      if (lo === "е" && (!prev || RU_VOW.indexOf(prev) >= 0 || !/\p{L}/u.test(prev))) r = "ye";
      var nxt = text[i + 1] || "";
      if (ch !== lo) r = (nxt && nxt !== nxt.toLowerCase()) ? r.toUpperCase() : r.charAt(0).toUpperCase() + r.slice(1);
      out += r;
    }
    return out;
  }

  /* ---------- Japonais : kana → rōmaji (Hepburn) ; les kanji ne sont pas lus ---------- */
  var KANA = {
    "あ":"a","い":"i","う":"u","え":"e","お":"o","か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko","さ":"sa","し":"shi","す":"su","せ":"se","そ":"so",
    "た":"ta","ち":"chi","つ":"tsu","て":"te","と":"to","な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no","は":"ha","ひ":"hi","ふ":"fu","へ":"he","ほ":"ho",
    "ま":"ma","み":"mi","む":"mu","め":"me","も":"mo","や":"ya","ゆ":"yu","よ":"yo","ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro","わ":"wa","ゐ":"i","ゑ":"e","を":"o","ん":"n",
    "が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go","ざ":"za","じ":"ji","ず":"zu","ぜ":"ze","ぞ":"zo","だ":"da","ぢ":"ji","づ":"zu","で":"de","ど":"do",
    "ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo","ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po","ゔ":"vu",
    "ぁ":"a","ぃ":"i","ぅ":"u","ぇ":"e","ぉ":"o","ゃ":"ya","ゅ":"yu","ょ":"yo","ゎ":"wa"
  };
  var YOON = { "ゃ":"a","ゅ":"u","ょ":"o" };
  var SMALL_V = { "ぁ":"a","ぃ":"i","ぅ":"u","ぇ":"e","ぉ":"o" };
  var JP_PUNCT = { "。":". ","、":", ","？":"? ","！":"! ","「":"“","」":"”","\u3000":" ","・":" ","〜":"~","（":"(","）":")","：":": " };
  function toHira(c) { var n = c.charCodeAt(0); return (n >= 0x30a1 && n <= 0x30f6) ? String.fromCharCode(n - 0x60) : c; }
  var MACRON = { a: "ā", i: "ī", u: "ū", e: "ē", o: "ō" };
  function japanese(text) {
    var out = "", unread = false, a = Array.from(text.replace(/こんにちは/g, "こんにちわ").replace(/こんばんは/g, "こんばんわ")), prevKanji = false;
    for (var i = 0; i < a.length; i++) {
      var c = toHira(a[i]), nx = toHira(a[i + 1] || "");
      var isKanji = /[\u4e00-\u9fff\u3400-\u4dbf々]/.test(c);
      if (out && isKanji !== prevKanji && !/\s$/.test(out) && (KANA[c] !== undefined || isKanji)) out += " ";
      if (JP_PUNCT[c]) { out += JP_PUNCT[c]; prevKanji = false; continue; }
      if (c === "ー") { out = out.replace(/[aeiou]$/, function (v) { return MACRON[v]; }); continue; }
      if (c === "っ") { var nr = KANA[nx]; out += nr ? nr.charAt(0) === "c" ? "t" : nr.charAt(0) : ""; prevKanji = false; continue; }
      var r = KANA[c];
      if (r === undefined) { if (isKanji) unread = true; out += c; prevKanji = isKanji; continue; }
      prevKanji = false;
      if (YOON[nx] && /i$/.test(r) && r.length > 1) {
        var base = r.slice(0, -1);
        r = (/^(sh|ch|j)$/.test(base) ? base : base + "y") + YOON[nx]; i++;
      } else if (SMALL_V[nx] && /u$/.test(r) && r.length > 1) { r = r.slice(0, -1) + SMALL_V[nx]; i++; }
      else if (SMALL_V[nx] && /^(chi|shi|ji|te|de)$/.test(r)) { r = r.replace(/[ie]$/, "") + SMALL_V[nx]; i++; }
      else if (c === "ん" && /^[aiueoy]/.test(KANA[nx] || "")) r = "n'";
      /* voyelles longues : ou / oo → ō, uu → ū */
      if ((r === "u" && /o$/.test(out)) || (r === "o" && /o$/.test(out) && c !== "を")) { out = out.slice(0, -1) + "ō"; continue; }
      if (r === "u" && /u$/.test(out)) { out = out.slice(0, -1) + "ū"; continue; }
      out += r;
    }
    out = out.replace(/\s+/g, " ").replace(/\s+([.,?!])/g, "$1").trim();
    return { text: out.charAt(0).toUpperCase() + out.slice(1), partial: unread };
  }

  /* ---------- Chinois : pinyin (bibliothèque pinyin-pro, chargée localement) ---------- */
  function chinese(text) {
    var P = typeof self !== "undefined" && self.pinyinPro;
    if (!P || typeof P.pinyin !== "function") return null;
    try {
      var s = P.pinyin(text, { toneType: "symbol", nonZh: "consecutive" });
      s = String(s).replace(/\s+([。，？！、；：.,?!;:])/g, "$1").replace(/[。]/g, ".").replace(/[，、]/g, ",").replace(/？/g, "?").replace(/！/g, "!").replace(/\s+/g, " ").trim();
      return s.charAt(0).toUpperCase() + s.slice(1);
    } catch (e) { return null; }
  }

  function hasNonLatin(text) { return /[\u0370-\u03ff\u1f00-\u1fff\u0400-\u04ff\u3040-\u30ff\u4e00-\u9fff\u3400-\u4dbf]/.test(text); }

  /* Renvoie { text, note } ou null si la langue s'écrit déjà en alphabet latin. */
  function romanize(text, script) {
    if (!text || !hasNonLatin(text)) return null;
    if (script === "greek") return { text: greek(text), note: "Translittération grecque (ELOT 743)" };
    if (script === "cyrillic") return { text: russian(text), note: "Translittération du russe" };
    if (script === "japanese") {
      var j = japanese(text);
      return { text: j.text, note: j.partial ? "Rōmaji : les kanji restent affichés (lecture non disponible hors vocabulaire)" : "Rōmaji (Hepburn)" };
    }
    if (script === "han") {
      var p = chinese(text);
      return p ? { text: p, note: "Pinyin avec tons" } : { text: "", note: "Pinyin : module non chargé" };
    }
    return null;
  }
  return { romanize: romanize, greek: greek, russian: russian, japanese: japanese, chinese: chinese, hasNonLatin: hasNonLatin };
})();
if (typeof module !== "undefined") module.exports = BibiTranslit;
