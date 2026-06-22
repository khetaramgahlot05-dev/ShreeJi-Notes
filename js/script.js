// Sample products data
const products = [
    {
        id: 1,
        title: 'JavaScript Fundamentals',
        description: 'Complete guide to JavaScript basics, syntax, and best practices',
        price: 299,
        category: 'Programming',
        pages: 156,
        fileSize: '2.5 MB',
        icon: '💻'
    },
    {
        id: 2,
        title: 'React Advanced Patterns',
        description: 'Master React hooks, context, and performance optimization',
        price: 399,
        category: 'Programming',
        pages: 204,
        fileSize: '3.2 MB',
        icon: '⚛️'
    },
    {
        id: 3,
        title: 'Web Design Essentials',
        description: 'UI/UX principles, design systems, and responsive layouts',
        price: 349,
        category: 'Design',
        pages: 178,
        fileSize: '2.8 MB',
        icon: '🎨'
    },
    {
        id: 4,
        title: 'Database Design Guide',
        description: 'SQL, NoSQL, and database architecture fundamentals',
        price: 429,
        category: 'Database',
        pages: 220,
        fileSize: '3.5 MB',
        icon: '🗄️'
    },
    {
        id: 5,
        title: 'Python for Data Science',
        description: 'Data manipulation, analysis, and visualization with Python',
        price: 449,
        category: 'Programming',
        pages: 245,
        fileSize: '3.8 MB',
        icon: '🐍'
    },
    {
        id: 6,
        title: 'Mathematics for Engineers',
        description: 'Calculus, Linear Algebra, and Differential Equations',
        price: 379,
        category: 'Mathematics',
        pages: 312,
        fileSize: '4.1 MB',
        icon: '📐'
    }
];

// Shopping cart
let cart = [];

// Load products on page load
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadCart();
});

// Load and display products
function loadProducts() {
    const productsGrid = document.getElementById('productsGrid');
    productsGrid.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">${product.icon}</div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-meta">
                    <span>${product.pages} Pages</span>
                    <span>${product.fileSize}</span>
                </div>
                <div class="product-price">₹${product.price}</div>
                <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        `;
        productsGrid.appendChild(productCard);
    });
}

// Add product to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({...product, quantity: 1});
    }
    
    saveCart();
    updateCartCount();
    showNotification(`${product.title} added to cart!`);
}

// Remove from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    loadCart();
}

// Update cart display
function loadCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p>Your cart is empty</p>';
        cartTotal.textContent = '0';
        return;
    }
    
    cartItems.innerHTML = '';
    let total = 0;
    
    cart.forEach(item => {
        total += item.price * item.quantity;
        const cartItem = document.createElement('div');
        cartItem.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #e5e7eb;';
        cartItem.innerHTML = `
            <div>
                <h4>${item.title}</h4>
                <p style="color: #6b7280; font-size: 0.9rem;">Quantity: ${item.quantity}</p>
            </div>
            <div style="text-align: right;">
                <p style="font-weight: bold; margin-bottom: 0.5rem;">₹${item.price * item.quantity}</p>
                <button class="btn" style="background: #ef4444; color: white; padding: 0.5rem 1rem; font-size: 0.9rem;" onclick="removeFromCart(${item.id})">Remove</button>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });
    
    cartTotal.textContent = total;
}

// Update cart count badge
function updateCartCount() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }
}

// Cart icon click handler
document.addEventListener('DOMContentLoaded', function() {
    const cartIcon = document.querySelector('.cart-icon');
    if (cartIcon) {
        cartIcon.addEventListener('click', function() {
            document.getElementById('cartModal').style.display = 'block';
            loadCart();
        });
    }
});

// Close cart modal
function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCartFromStorage() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 9999;
        animation: slideIn 0.3s ease-in-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Contact form handler
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showNotification('Thank you! We will get back to you soon.');
            contactForm.reset();
        });
    }
});

// Close modal when clicking outside
window.addEventListener('click', function(event) {
    const modal = document.getElementById('cartModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
});

// Load cart on page load
loadCartFromStorage();

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
