// Popup Logic
document.addEventListener("DOMContentLoaded", () => {
    // Check if we are on the home page (index.html or root)
    if(window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        // Show popup after a slight delay
        setTimeout(() => {
            document.getElementById('welcomePopup').classList.add('active');
        }, 500);
    }
});

function closePopup() {
    document.getElementById('welcomePopup').classList.remove('active');
}

// Product Gallery Logic
function switchImage(src, element) {
    // Change main image
    document.getElementById('main-product-img').src = src;
    
    // Manage active state of thumbnails
    let thumbs = document.querySelectorAll('.thumb');
    thumbs.forEach(t => t.classList.remove('active'));
    element.classList.add('active');
}
