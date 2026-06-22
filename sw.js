/* 서비스워커 — 앱 셸 오프라인 캐시 */
const VER = "ddj-final-v6";
const SHELL = [
  ".", "index.html",
  "css/app.css?v=6",
  "js/config.js?v=6", "js/core.js?v=6", "js/vocab.js?v=6", "js/reading.js?v=6", "js/quiz.js?v=6", "js/course.js?v=6", "js/app.js?v=6",
  "data/vocab.json", "data/synant.json", "data/reading.json", "data/bank.json", "data/guide.json",
  "manifest.webmanifest"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;            // POST(백엔드)는 통과
  if (url.origin !== location.origin) return;        // 외부(카카오/Apps Script) 통과
  // data/json·audio: 네트워크 우선, 실패 시 캐시
  if (/\/data\/.*\.json$/.test(url.pathname) || /\/audio\//.test(url.pathname)) {
    e.respondWith(
      fetch(e.request).then(r => { const cp = r.clone(); caches.open(VER).then(c => c.put(e.request, cp)); return r; })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  // 앱 셸: 캐시 우선
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
