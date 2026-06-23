import { formatCurrency, validatePhone, validateEmail, compressImage, showNotification } from './main.js';
import { db } from './firebase-config.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js';

let currentProduct = null;
let currentStep = 1;
let orderData = {};
let paymentQRCode = null;
let paymentTimer = null;

export function initializeCheckout() {
  const buyButtons = document.querySelectorAll('[data-buy]');
  buyButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const productId = e.target.dataset.buy;
      openCheckoutModal(productId);
    });
  });
}

async function openCheckoutModal(productId) {
  // Create modal if not exists
  let modal = document.getElementById('checkout-modal');
  if (!modal) {
    modal = createCheckoutModal();
    document.body.appendChild(modal);
  }

  // Load product
  const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');
  const productRef = doc(db, 'products', productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    showNotification('Product not found', 'error');
    return;
  }

  currentProduct = { id: productId, ...productSnap.data() };
  currentStep = 1;
  orderData = {};
  paymentQRCode = null;

  modal.style.display = 'flex';
  showCheckoutStep1();
}

function createCheckoutModal() {
  const modal = document.createElement('div');
  modal.id = 'checkout-modal';
  modal.style.cssText = `
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.3s ease-out;
  `;

  modal.innerHTML = '<div id="checkout-content" style="background: #FBF6EC; border-radius: 16px; max-width: 480px; width: 100%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);"></div>';

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  return modal;
}

function showCheckoutStep1() {
  const content = document.getElementById('checkout-content');
  content.innerHTML = `
    <div style="padding: 32px;">
      <div style="margin-bottom: 24px;">
        <h2 style="font-size: 1.5rem; color: #6B1A2A; margin-bottom: 8px;">${currentProduct.title}</h2>
        <p style="color: #6B5F4F; font-size: 0.95rem;">${currentProduct.subject}</p>
        <p style="font-size: 1.5rem; color: #6B1A2A; font-weight: 700; margin-top: 12px;">₹${currentProduct.price}</p>
      </div>
      <form id="contact-form" style="display: flex; flex-direction: column; gap: 16px;">
        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2B2118;">Full Name *</label>
          <input type="text" id="buyer-name" placeholder="Your full name" required style="width: 100%; padding: 12px; border: 2px solid #E5D9C7; border-radius: 8px; font-family: inherit; font-size: 1rem;">
          <span class="error" style="color: #B23A2E; font-size: 0.85rem; display: none;"></span>
        </div>
        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2B2118;">Phone Number *</label>
          <input type="tel" id="buyer-phone" placeholder="10-digit phone number" maxlength="10" required style="width: 100%; padding: 12px; border: 2px solid #E5D9C7; border-radius: 8px; font-family: inherit; font-size: 1rem;">
          <span class="error" style="color: #B23A2E; font-size: 0.85rem; display: none;"></span>
        </div>
        <div>
          <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #2B2118;">Email Address *</label>
          <input type="email" id="buyer-email" placeholder="your.email@example.com" required style="width: 100%; padding: 12px; border: 2px solid #E5D9C7; border-radius: 8px; font-family: inherit; font-size: 1rem;">
          <span class="error" style="color: #B23A2E; font-size: 0.85rem; display: none;"></span>
        </div>
        <button type="button" onclick="window.checkoutNext()" style="padding: 14px; background: linear-gradient(135deg, #6B1A2A 0%, #4A0F1C 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; margin-top: 16px;">Continue → Payment</button>
      </form>
    </div>
  `;

  window.checkoutNext = validateStep1;
}

function validateStep1() {
  const name = document.getElementById('buyer-name');
  const phone = document.getElementById('buyer-phone');
  const email = document.getElementById('buyer-email');
  let isValid = true;

  // Validate name
  if (!name.value.trim()) {
    showError(name, 'Please enter your name');
    isValid = false;
  } else {
    clearError(name);
  }

  // Validate phone
  if (!validatePhone(phone.value)) {
    showError(phone, 'Enter valid 10-digit phone number');
    isValid = false;
  } else {
    clearError(phone);
  }

  // Validate email
  if (!validateEmail(email.value)) {
    showError(email, 'Enter valid email address');
    isValid = false;
  } else {
    clearError(email);
  }

  if (isValid) {
    orderData = {
      buyerName: name.value,
      buyerPhone: phone.value,
      buyerEmail: email.value
    };
    currentStep = 2;
    showCheckoutStep2();
  }
}

function showError(input, message) {
  input.style.borderColor = '#B23A2E';
  const errorSpan = input.parentElement.querySelector('.error');
  if (errorSpan) {
    errorSpan.textContent = message;
    errorSpan.style.display = 'block';
  }
}

function clearError(input) {
  input.style.borderColor = '#E5D9C7';
  const errorSpan = input.parentElement.querySelector('.error');
  if (errorSpan) {
    errorSpan.style.display = 'none';
  }
}

async function showCheckoutStep2() {
  // Load payment QR from Firestore
  const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');
  const paymentRef = doc(db, 'settings', 'payment');
  const paymentSnap = await getDoc(paymentRef);

  if (paymentSnap.exists()) {
    paymentQRCode = paymentSnap.data().qrCodeImage;
  }

  const content = document.getElementById('checkout-content');
  content.innerHTML = `
    <div style="padding: 32px;">
      <h2 style="font-size: 1.5rem; color: #6B1A2A; margin-bottom: 24px; text-align: center;">Step 2: Secure Payment</h2>
      
      <div style="background: white; padding: 24px; border-radius: 12px; border: 2px dashed #C9A227; margin-bottom: 24px; text-align: center;">
        <p style="color: #6B5F4F; font-size: 0.9rem; margin-bottom: 16px; font-weight: 600;">Scan this QR with any UPI app to pay</p>
        ${paymentQRCode ? `<img src="${paymentQRCode}" style="width: 100%; max-width: 280px; border-radius: 8px;">` : '<p>Loading QR code...</p>'}
        <p style="color: #6B1A2A; font-size: 1.8rem; font-weight: 700; margin: 16px 0;">₹${currentProduct.price}</p>
      </div>

      <div style="background: #FFF8F0; padding: 12px; border-radius: 8px; margin-bottom: 24px;">
        <p style="color: #B23A2E; font-weight: 600; font-size: 0.95rem;">⏱ Time remaining: <span id="timer">10:00</span></p>
      </div>

      <div style="margin-bottom: 24px;">
        <label style="display: block; margin-bottom: 12px; font-weight: 600; color: #2B2118;">Upload Payment Screenshot *</label>
        <input type="file" id="screenshot" accept="image/*" style="width: 100%; padding: 12px; border: 2px dashed #C9A227; border-radius: 8px; cursor: pointer;">
        <div id="screenshot-preview" style="margin-top: 12px; display: none;">
          <img id="preview-img" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
        </div>
      </div>

      <button type="button" id="place-order-btn" disabled onclick="window.placeOrder()" style="width: 100%; padding: 14px; background: linear-gradient(135deg, #6B1A2A 0%, #4A0F1C 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; opacity: 0.5; margin-top: 16px;">Place Order</button>
      
      <p style="color: #6B5F4F; font-size: 0.85rem; margin-top: 16px; text-align: center; line-height: 1.6;">After payment verification, your PDF will be sent to <strong>${orderData.buyerEmail}</strong> within a few hours.</p>
    </div>
  `;

  // Handle screenshot upload
  const screenshotInput = document.getElementById('screenshot');
  screenshotInput.addEventListener('change', handleScreenshotUpload);

  // Start timer
  startPaymentTimer();

  window.placeOrder = submitOrder;
}

function handleScreenshotUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const preview = document.getElementById('screenshot-preview');
  const previewImg = document.getElementById('preview-img');
  const reader = new FileReader();

  reader.onload = () => {
    previewImg.src = reader.result;
    preview.style.display = 'block';
    document.getElementById('place-order-btn').disabled = false;
    document.getElementById('place-order-btn').style.opacity = '1';
  };

  reader.readAsDataURL(file);
}

function startPaymentTimer() {
  let seconds = 600; // 10 minutes

  paymentTimer = setInterval(() => {
    seconds--;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    document.getElementById('timer').textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;

    if (seconds <= 0) {
      clearInterval(paymentTimer);
      document.getElementById('place-order-btn').style.display = 'none';
      document.getElementById('checkout-content').innerHTML += '<div style="padding: 24px; text-align: center; color: #B23A2E; font-weight: 600;">Payment time expired. Please refresh to get a new QR code.</div>';
    }
  }, 1000);
}

async function submitOrder() {
  const screenshotInput = document.getElementById('screenshot');
  if (!screenshotInput.files[0]) {
    showNotification('Please upload payment screenshot', 'error');
    return;
  }

  // Compress screenshot
  let compressedScreenshot;
  try {
    compressedScreenshot = await compressImage(screenshotInput.files[0]);
  } catch (error) {
    showNotification('Error processing screenshot', 'error');
    return;
  }

  // Save order to Firestore
  try {
    const orderRef = await addDoc(collection(db, 'orders'), {
      productId: currentProduct.id,
      productTitle: currentProduct.title,
      amount: currentProduct.price,
      buyerName: orderData.buyerName,
      buyerPhone: orderData.buyerPhone,
      buyerEmail: orderData.buyerEmail,
      paymentScreenshot: compressedScreenshot,
      status: 'pending',
      statusNote: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    clearInterval(paymentTimer);
    showCheckoutStep3();
  } catch (error) {
    console.error('Error placing order:', error);
    showNotification('Error placing order. Please try again.', 'error');
  }
}

function showCheckoutStep3() {
  const content = document.getElementById('checkout-content');
  content.innerHTML = `
    <div style="padding: 48px 32px; text-align: center;">
      <div style="font-size: 4rem; margin-bottom: 24px; animation: scaleIn 0.5s ease-out;">✓</div>
      <h2 style="font-size: 1.8rem; color: #2E7D4F; margin-bottom: 16px;">Order Placed Successfully!</h2>
      <p style="color: #6B5F4F; font-size: 1.1rem; line-height: 1.8; margin-bottom: 32px;">Thank you for your purchase! We'll verify your payment and send your PDF notes to <strong>${orderData.buyerEmail}</strong> within a few hours.</p>
      <button onclick="document.getElementById('checkout-modal').style.display='none';location.reload();" style="padding: 12px 32px; background: linear-gradient(135deg, #6B1A2A 0%, #4A0F1C 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Done</button>
    </div>
  `;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0); }
  to { transform: scale(1); }
}
