"use strict";
const $ = s => document.querySelector(s);
const eur = n => n.toLocaleString("fr-FR", { style:"currency", currency:"EUR" });
const store = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
let taken = store.get("taken", {}), cat = "Tous", sort = "priorite";
const rank = Object.fromEntries(WISHES.map((w, i) => [w.id, i + 1]));

function toast(msg){ const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 2200); }

function sorted(list){
  const p = w => w.price ?? Infinity;
  if (sort === "prix-asc") return [...list].sort((a, b) => p(a) - p(b));
  if (sort === "prix-desc") return [...list].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
  return list;
}

function render(){
  const root = $("#liste"); root.replaceChildren();
  sorted(WISHES.filter(w => cat === "Tous" || w.cat === cat)).forEach(w => {
    const n = $("#tpl").content.cloneNode(true), card = n.querySelector(".card");
    card.id = "w-" + w.id; card.classList.toggle("done", !!taken[w.id]);
    const v = n.querySelector(".visual"); v.style.background = `linear-gradient(135deg,${w.grad[0]},${w.grad[1]})`;
    n.querySelector(".badge").textContent = w.url ? "Priorité " + rank[w.id] : "Idée libre";
    n.querySelector(".emo").textContent = w.emoji;
    if (w.image){ const i = n.querySelector("img"); i.src = w.image; i.hidden = false; i.alt = w.title; }
    n.querySelector("h2").textContent = w.title; n.querySelector(".brand").textContent = w.brand;
    const pr = n.querySelector(".price");
    if (w.price){ pr.textContent = eur(w.price); if (w.old){ const s = document.createElement("s"); s.textContent = eur(w.old); pr.append(s); } }
    else { pr.textContent = "Carte blanche !"; pr.classList.add("free"); }
    n.querySelector(".desc").textContent = w.desc;
    w.tags.forEach(t => { const li = document.createElement("li"); li.textContent = t; n.querySelector(".tags").append(li); });
    const buy = n.querySelector(".buy");
    if (w.url){ buy.href = w.url; buy.textContent = "Voir sur " + w.shop; }
    else { buy.classList.add("none"); buy.removeAttribute("target"); buy.setAttribute("role", "note"); buy.textContent = "Carte blanche !"; }
    const t = n.querySelector(".take"); t.setAttribute("aria-pressed", !!taken[w.id]);
    t.textContent = taken[w.id] ? "Réservé ✓" : "Je m’en occupe";
    t.onclick = () => { taken[w.id] = !taken[w.id]; store.set("taken", taken); toast(taken[w.id] ? "Cadeau réservé" : "Réservation annulée"); render(); };
    root.append(n);
  });
  const sl = $("#slots"); sl.replaceChildren();
  WISHES.forEach(w => { const a = document.createElement("a"); a.className = "slot" + (taken[w.id] ? " on" : ""); a.href = "#w-" + w.id; a.textContent = w.emoji; a.setAttribute("role", "listitem"); a.setAttribute("aria-label", w.title + (taken[w.id] ? " (réservé)" : "")); a.onclick = () => { if (cat !== "Tous" && cat !== w.cat){ setCat("Tous"); } }; sl.append(a); });
  const done = WISHES.filter(w => taken[w.id]).length;
  $("#progress").textContent = done + " sur " + WISHES.length + " déjà prévus";
}

function setCat(c){ cat = c; [...$("#filtres").children].forEach(b => b.setAttribute("aria-pressed", b.textContent === c)); render(); }
["Tous", ...new Set(WISHES.map(w => w.cat))].forEach(c => {
  const b = document.createElement("button"); b.className = "chip"; b.textContent = c; b.setAttribute("aria-pressed", c === cat); b.onclick = () => setCat(c); $("#filtres").append(b);
});
$("#tri").onchange = e => { sort = e.target.value; render(); };

$("#nb").textContent = WISHES.length;
$("#total").textContent = eur(WISHES.reduce((a, w) => a + (w.price || 0), 0));
const now = new Date(), d = Math.ceil((new Date(now.getFullYear(), 11, 25) - now) / 864e5);
$("#jours").textContent = d > 1 ? d + " jours" : d === 1 ? "demain !" : d === 0 ? "aujourd’hui !" : "l’an prochain";

const root = document.documentElement, saved = store.get("theme", null);
if (saved) root.dataset.theme = saved;
$("#theme").onclick = () => { const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches; root.dataset.theme = dark ? "light" : "dark"; store.set("theme", root.dataset.theme); };

$("#share").onclick = async () => {
  const data = { title: document.title, text: "Ma liste de Noël", url: location.href.split("#")[0] };
  try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(data.url); toast("Lien copié"); } } catch {}
};
render();
