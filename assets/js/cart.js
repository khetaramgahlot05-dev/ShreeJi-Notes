// ==========================================================================
// ShreeJi Notes — Checkout Modal (Add to Cart / Buy Now flow)
// Injects a self-contained modal into every page that imports this file.
// Flow: Step 1 (contact details) -> Step 2 (QR + timer + screenshot) -> Step 3 (success)
// ==========================================================================
import {
  db, doc, getDoc, addDoc, collection, serverTimestamp
} from "./firebase-config.js";
import { formatINR, compressImageToBase64, startCountdown, escapeHTML } from "./main.js";

const PAYMENT_WINDOW_SECONDS = 10 * 60; // 10 minute QR timer

let currentProduct = null;
let countdownTimer = null;
let screenshotBase64 = null;

const modalHTML = `
<div class="modal-overlay" id="checkoutModal">
  <div class="modal-box">
    <button class="modal-close" type="button" aria-label="Close" id="checkoutClose">&times;</button>

    <!-- Step 1: Contact details -->
    <div class="modal-step active" data-step="1">
      <div class="modal-head"><h3 style="margin-bottom:4px;">Your details</h3>
        <p class="muted" style="margin-top:0;font-size:0.85rem;" id="checkoutProductLabel"></p>
      </div>
      <div class="modal-body">
        <div class="field" id="f-name">
          <label for="buyerName">Full name</label>
          <input type="text" id="buyerName" placeholder="Your name" autocomplete="name">
          <div class="error">Please enter your name</div>
        </div>
        <div class="field" id="f-phone">
          <label for="buyerPhone">Phone number</label>
          <input type="tel" id="buyerPhone" placeholder="10-digit mobile number" autocomplete="tel">
          <div class="error">Please enter a valid 10-digit phone number</div>
        </div>
        <div class="field" id="f-email">
          <label for="buyerEmail">Email</label>
          <input type="email" id="buyerEmail" placeholder="you@example.com" autocomplete="email">
          <div class="error">Please enter a valid email</div>
        </div>
        <button class="btn btn-primary btn-block" id="checkoutContinue">Continue</button>
      </div>
    </div>

    <!-- Step 2: QR + timer + screenshot -->
    <div class="modal-step" data-step="2">
      <div class="modal-head"><h3 style="margin-bottom:4px;">Scan &amp; pay</h3></div>
      <div class="modal-body">
        <div class="text-center" style="margin-bottom:14px;">
          <img id="qrImage" src="" alt="Payment QR code" style="width:190px;height:190px;object-fit:contain;border:1.5px solid var(--rule-line);border-radius:var(--radius-md);background:#fff;padding:10px;">
          <div style="margin-top:10px;font-family:var(--font-display);font-weight:800;font-size:1.4rem;color:var(--maroon);" id="qrAmount"></div>
          <div class="muted" style="font-size:0.82rem;">Time left to pay: <strong id="qrTimer" style="color:var(--maroon);">10:00</strong></div>
        </div>
        <div class="field">
          <label for="screenshotInput">Upload payment screenshot</label>
          <input type="file" id="screenshotInput" accept="image/*">
          <div class="hint">After paying, upload a screenshot here as proof.</div>
          <div class="error">Please upload a screenshot before placing the order</div>
        </div>
        <div id="screenshotPreviewWrap" style="display:none;margin-bottom:12px;">
          <img id="screenshotPreview" style="max-height:140px;border-radius:var(--radius-sm);border:1px solid var(--rule-line);">
        </div>
        <button class="btn btn-primary btn-block" id="placeOrderBtn">Place order</button>
        <div id="qrExpiredMsg" style="display:none;text-align:center;margin-top:12px;color:var(--danger);font-size:0.85rem;">
          Time expired. <button type="button" class="btn btn-outline btn-sm" id="restartTimerBtn" style="margin-top:8px;">Get a new QR</button>
        </div>
      </div>
    </div>

    <!-- Step 3: Success -->
    <div class="modal-step" data-step="3">
      <div class="modal-body text-center" style="padding-top:34px;">
        <div style="width:60px;height:60px;border-radius:50%;background:var(--success);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 16px;">✓</div>
        <h3>Order placed</h3>
        <p class="muted">We're verifying your payment. Your notes will be sent to your email/phone within a few hours once confirmed.</p>
        <button class="btn btn-primary" id="checkoutDone">Done</button>
      </div>
    </div>
  </div>
</div>`;

export function initCheckoutModal(){
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const overlay = document.getElementById("checkoutModal");
  const closeBtn = document.getElementById("checkoutClose");
  const doneBtn = document.getElementById("checkoutDone");
  const continueBtn = document.getElementById("checkoutContinue");
  const placeOrderBtn = document.getElementById("placeOrderBtn");
  const screenshotInput = document.getElementById("screenshotInput");
  const restartBtn = document.getElementById("restartTimerBtn");

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-buy]");
    if(!btn) return;
    e.preventDefault();
    await openModal(btn.getAttribute("data-buy"));
  });

  closeBtn.addEventListener("click", closeModal);
  doneBtn.addEventListener("click", closeModal);
  overlay.addEventListener("click", (e) => { if(e.target === overlay) closeModal(); });

  continueBtn.addEventListener("click", handleContinue);
  placeOrderBtn.addEventListener("click", handlePlaceOrder);
  restartBtn.addEventListener("click", () => goToStep(2, true));

  screenshotInput.addEventListener("change", async () => {
    const file = screenshotInput.files[0];
    if(!file) return;
    screenshotBase64 = await compressImageToBase64(file, 700, 0.6);
    document.getElementById("screenshotPreview").src = screenshotBase64;
    document.getElementById("screenshotPreviewWrap").style.display = "block";
    document.getElementById("f-screenshot")?.classList.remove("invalid");
  });

  async function openModal(productId){
    resetForm();
    const snap = await getDoc(doc(db, "products", productId));
    if(!snap.exists()) return;
    currentProduct = { id: snap.id, ...snap.data() };
    document.getElementById("checkoutProductLabel").textContent =
      `${currentProduct.title} — ${formatINR(currentProduct.price)}`;
    overlay.classList.add("open");
    goToStep(1);
  }

  function closeModal(){
    overlay.classList.remove("open");
    if(countdownTimer) clearInterval(countdownTimer);
  }

  function resetForm(){
    ["buyerName","buyerPhone","buyerEmail"].forEach(id => document.getElementById(id).value = "");
    ["f-name","f-phone","f-email"].forEach(id => document.getElementById(id).classList.remove("invalid"));
    screenshotInput.value = "";
    screenshotBase64 = null;
    document.getElementById("screenshotPreviewWrap").style.display = "none";
    document.getElementById("qrExpiredMsg").style.display = "none";
    placeOrderBtn.style.display = "block";
  }

  function handleContinue(){
    const name = document.getElementById("buyerName").value.trim();
    const phone = document.getElementById("buyerPhone").value.trim();
    const email = document.getElementById("buyerEmail").value.trim();
    let ok = true;
    toggleInvalid("f-name", name.length < 2); if(name.length < 2) ok = false;
    const phoneValid = /^[6-9]\d{9}$/.test(phone);
    toggleInvalid("f-phone", !phoneValid); if(!phoneValid) ok = false;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    toggleInvalid("f-email", !emailValid); if(!emailValid) ok = false;
    if(!ok) return;
    goToStep(2, true);
  }

  function toggleInvalid(fieldId, invalid){
    document.getElementById(fieldId).classList.toggle("invalid", invalid);
  }

  async function goToStep(stepNum, startTimer = false){
    document.querySelectorAll(".modal-step").forEach(s => s.classList.remove("active"));
    document.querySelector(`.modal-step[data-step="${stepNum}"]`).classList.add("active");

    if(stepNum === 2){
      document.getElementById("qrAmount").textContent = formatINR(currentProduct.price);
      document.getElementById("qrExpiredMsg").style.display = "none";
      placeOrderBtn.style.display = "block";
      if(startTimer){
        const settingsSnap = await getDoc(doc(db, "settings", "payment"));
        const qr = settingsSnap.exists() ? settingsSnap.data().qrCodeImage : "";
        document.getElementById("qrImage").src = qr || "";
        if(countdownTimer) clearInterval(countdownTimer);
        countdownTimer = startCountdown(PAYMENT_WINDOW_SECONDS, document.getElementById("qrTimer"), () => {
          document.getElementById("qrExpiredMsg").style.display = "block";
          placeOrderBtn.style.display = "none";
        });
      }
    }
  }

  async function handlePlaceOrder(){
    if(!screenshotBase64){
      alert("Please upload your payment screenshot before placing the order.");
      return;
    }
    placeOrderBtn.disabled = true;
    placeOrderBtn.textContent = "Placing order...";
    try{
      await addDoc(collection(db, "orders"), {
        productId: currentProduct.id,
        productTitle: currentProduct.title,
        amount: currentProduct.price,
        buyerName: escapeHTML(document.getElementById("buyerName").value.trim()),
        buyerPhone: document.getElementById("buyerPhone").value.trim(),
        buyerEmail: document.getElementById("buyerEmail").value.trim(),
        paymentScreenshot: screenshotBase64,
        status: "pending",
        createdAt: serverTimestamp()
      });
      if(countdownTimer) clearInterval(countdownTimer);
      goToStep(3);
    }catch(err){
      alert("Something went wrong placing your order. Please try again.");
      console.error(err);
    }finally{
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = "Place order";
    }
  }
}
