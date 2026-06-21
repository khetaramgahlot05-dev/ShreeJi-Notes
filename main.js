// ==========================================================================
// ShreeJi Notes — Shared site helpers (customer-facing pages)
// ==========================================================================
import { db, collection, getDocs, query, where, orderBy, limit } from "./firebase-config.js";

/* ---------------- Mobile nav ---------------- */
export function initMobileNav(){
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".main-nav");
  if(!toggle || !nav) return;
  toggle.addEventListener("click", () => nav.classList.toggle("open"));
  nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => nav.classList.remove("open")));
}

/* ---------------- Currency ---------------- */
export function formatINR(n){
  return "₹" + Number(n).toLocaleString("en-IN");
}

/* ---------------- Image compression (browser-side, no Storage needed) ----------------
   Resizes + compresses an uploaded image file into a small base64 JPEG string
   so it safely fits inside a Firestore document (1 MB limit per document). */
export function compressImageToBase64(file, maxWidth = 700, quality = 0.7){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load image"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------------- Products ---------------- */
export async function fetchProducts({ featuredOnly = false, subject = null, max = 50 } = {}){
  const col = collection(db, "products");
  const clauses = [where("active", "==", true)];
  if(featuredOnly) clauses.push(where("featured", "==", true));
  if(subject) clauses.push(where("subject", "==", subject));
  let q;
  try{
    q = query(col, ...clauses, orderBy("createdAt", "desc"), limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }catch(err){
    // Fallback without orderBy in case a composite index isn't created yet
    q = query(col, ...clauses, limit(max));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

export function productCardHTML(p){
  const img = (p.images && p.images[0]) ? p.images[0] : "";
  const off = p.mrp && p.price ? Math.round(100 - (p.price / p.mrp) * 100) : null;
  return `
  <article class="card-product">
    <a href="product.html?id=${p.id}">
      ${img ? `<img class="thumb" src="${img}" alt="${escapeHTML(p.title)} cover">`
            : `<div class="thumb" style="display:flex;align-items:center;justify-content:center;color:var(--ink-soft);font-size:0.8rem;">No image yet</div>`}
    </a>
    <div class="body">
      ${p.featured ? `<span class="badge">Best Seller</span>` : ``}
      <a href="product.html?id=${p.id}" class="title">${escapeHTML(p.title)}</a>
      <div class="meta">${escapeHTML(p.category || "")}</div>
      <div class="price-row">
        <span class="price-now">${formatINR(p.price)}</span>
        ${p.mrp ? `<span class="price-mrp">${formatINR(p.mrp)}</span>` : ``}
        ${off ? `<span class="price-off">${off}% off</span>` : ``}
      </div>
      <div class="actions">
        <a class="btn btn-outline btn-sm" href="product.html?id=${p.id}">View</a>
        <button class="btn btn-primary btn-sm" data-buy="${p.id}">Buy Now</button>
      </div>
    </div>
  </article>`;
}

export function escapeHTML(str = ""){
  return String(str).replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]));
}

/* ---------------- Countdown timer (used in checkout modal) ---------------- */
export function startCountdown(seconds, el, onExpire){
  let remaining = seconds;
  el.textContent = formatTime(remaining);
  const t = setInterval(() => {
    remaining--;
    el.textContent = formatTime(remaining);
    if(remaining <= 0){
      clearInterval(t);
      if(onExpire) onExpire();
    }
  }, 1000);
  return t;
  function formatTime(s){
    const m = Math.floor(s/60).toString().padStart(2,"0");
    const sec = (s%60).toString().padStart(2,"0");
    return `${m}:${sec}`;
  }
}
