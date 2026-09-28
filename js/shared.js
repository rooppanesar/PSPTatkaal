const KEY = "tatkaal_applications_v2";
const load = () => JSON.parse(localStorage.getItem(KEY) || "[]");
const save = (list) => localStorage.setItem(KEY, JSON.stringify(list));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);
const nextApplicationNumber = () => {
  const year = new Date().getFullYear();
  const list = load();
  const max = list.reduce((n, r) => {
    const m = String(r.applicationNumber || "").match(/^TAT(\d{4})(\d{6})$/);
    return m && Number(m[1]) === year ? Math.max(n, Number(m[2])) : n;
  }, 0);
  return `TAT${year}${String(max + 1).padStart(6, "0")}`;
};
const fmtDate = (t) => new Date(t).toLocaleDateString("en-CA", {year:"numeric", month:"short", day:"numeric"});
const fmtDateTime = (t) => new Date(t).toLocaleString("en-CA", {year:"numeric", month:"short", day:"numeric", hour:"numeric", minute:"2-digit"});
const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));

const REJECT_REASONS = [
  "Passport is expired","Passport valid for more than 12 months","Ineligible immigration status",
  "Police report / previous passport unclear or unavailable","Passport looks damaged",
  "Unclear document — please reapply with better photos of documents","Incorrect jurisdiction",
  "Incomplete documentation (passport copy / proof of status missing)","Incorrect passport details",
  "Name or photo mismatch between passport and status document"
];
const RESUBMIT_OK_REASON = "Unclear document — please reapply with better photos of documents";

let state = {};
const app = document.getElementById("app");
function go(screen, extra){ state = { screen, ...extra }; render(); window.scrollTo(0,0); }
function toast(msg){
  const t = document.createElement("div"); t.className="toast"; t.textContent = msg;
  document.body.appendChild(t); setTimeout(()=>t.remove(), 3800);
}
function progressBar(step, total){
  return `<div class="progress"><span>Progress</span><span>Step ${step} of ${total}</span></div>
  <div class="bar"><i style="width:${(step/total)*100}%"></i></div>`;
}
function docThumb(label, doc){
  return `<div class="doc-thumb">
    <div class="doc-thumb-label">${escapeHtml(label)}</div>
    ${doc && doc.img ? `<img class="doc-img" src="${doc.img}" alt="${escapeHtml(label)}" data-label="${escapeHtml(label)}" title="Click to view full size">`
               : `<div class="doc-missing">No preview available</div>`}
    <div class="small">${escapeHtml(doc?.name || "No file")}</div>
  </div>`;
}
function openViewer(src, label){
  closeViewer();
  const v = document.createElement("div");
  v.className = "viewer"; v.id = "docViewer";
  v.innerHTML = `<div class="viewer-bar"><span>${escapeHtml(label)}</span>
    <span><a class="btn ghost" href="${src}" download="${label.replace(/[^a-z0-9]+/gi,"_")}.jpg">Download</a>
    <button class="btn ghost" id="viewerClose">Close ✕</button></span></div>
    <div class="viewer-body"><img src="${src}" alt="${escapeHtml(label)}" class="fit"></div>`;
  document.body.appendChild(v);
  v.querySelector("#viewerClose").onclick = closeViewer;
  v.querySelector("img").onclick = e => e.target.classList.toggle("fit");
  v.querySelector(".viewer-body").onclick = e => { if (e.target.classList.contains("viewer-body")) closeViewer(); };
}
function closeViewer(){ const v = document.getElementById("docViewer"); if (v) v.remove(); }
document.addEventListener("click", e => { const img = e.target.closest(".doc-img"); if (img) openViewer(img.src, img.dataset.label); });
document.addEventListener("keydown", e => { if (e.key === "Escape") closeViewer(); });
