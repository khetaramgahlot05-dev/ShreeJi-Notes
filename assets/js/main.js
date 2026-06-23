export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function calculateDiscount(original, current) {
  return Math.round(((original - current) / original) * 100);
}

export function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 && /^[6-9]/.test(cleaned);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function compressImage(file, maxWidth = 700, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result);
          };
          reader.readAsDataURL(blob);
        }, 'image/jpeg', quality);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function formatDate(date) {
  if (!(date instanceof Date)) {
    date = date.toDate ? date.toDate() : new Date(date);
  }
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}

export function showNotification(message, type = 'success') {
  const div = document.createElement('div');
  div.className = `notification notification-${type}`;
  div.textContent = message;
  div.style.cssText = `
    position: fixed;
    bottom: 24px;
    right: 24px;
    background: ${type === 'success' ? '#2E7D4F' : '#B23A2E'};
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
    z-index: 10000;
    animation: slideUp 0.3s ease-out;
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

export async function loadProducts() {
  try {
    const { collection, getDocs, query, where } = await import('https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js');
    const { db } = await import('./firebase-config.js');
    
    const q = query(collection(db, 'products'), where('active', '==', true));
    const snapshot = await getDocs(q);
    
    const products = [];
    snapshot.forEach(doc => {
      products.push({ id: doc.id, ...doc.data() });
    });
    return products;
  } catch (error) {
    console.error('Error loading products:', error);
    return [];
  }
}

export function renderProductCard(product) {
  const discount = calculateDiscount(product.mrp, product.price);
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML = `
    <div class="product-image">
      📖
      ${product.featured ? '<div class="product-badge">⭐ Best Seller</div>' : ''}
    </div>
    <div class="product-info">
      <div class="product-subject">${product.subject}</div>
      <h3 class="product-title">${product.title}</h3>
      <div class="product-price">
        <span class="price-original">₹${product.mrp}</span>
        <span class="price-current">₹${product.price}</span>
        <span class="discount-badge">-${discount}%</span>
      </div>
      <div class="product-actions">
        <button class="btn btn-details" onclick="location.href='product.html?id=${product.id}'">View Details</button>
        <button class="btn btn-buy" data-buy="${product.id}">Buy Now</button>
      </div>
    </div>
  `;
  return card;
}
