# ShreeJi Notes — Website

## ✅ Abhi kya ban chuka hai (Stage 1)
- `index.html` — Homepage (hero, featured notes, how it works, subjects)
- `assets/css/style.css` — Pura brand design system (maroon/gold parchment theme)
- `assets/js/firebase-config.js` — Firebase connection (already configured with aapka project)
- `assets/js/main.js` — Shared helpers (product fetch, image compression, currency format)
- `assets/js/cart.js` — Add to Cart / Buy Now checkout modal (Name → Phone → Email → QR + Timer → Screenshot upload → Order placed)

## 🔜 Agle stages mein banega
- `store.html` (Notes Store / catalog page)
- `product.html` (Product detail page)
- `about.html`, `contact.html`, `faq.html`, `delivery-info.html`, `terms.html`, `refund-policy.html`, `privacy-policy.html`, `disclaimer.html`
- `admin/` folder — Dashboard, Products manager, Orders manager, Payment QR settings, Page content editor

## 🚀 GitHub par kaise daalein

1. GitHub.com par jaake naya repository banao — naam do `shreejinotes` (ya jo bhi pasand ho)
2. Repository **Public** rakho (GitHub Pages free tier ke liye zaroori hai)
3. Is poore folder (`shreejinotes/`) ke andar ka saara content us repository mein upload kar do:
   - GitHub website par "Add file" → "Upload files" se seedha drag-drop kar sakte ho
4. Repository ki **Settings** tab kholo → left sidebar mein **Pages** pe click karo
5. "Branch" mein `main` select karo, folder `/ (root)` rakho → **Save**
6. 1-2 minute mein aapki site live ho jayegi is link par:
   `https://<aapka-github-username>.github.io/shreejinotes/`

## 🧪 Test karne ke liye (abhi products khaali hain)

Homepage abhi "Notes will appear here once added from admin panel" dikhayega kyunki Firestore mein abhi koi product nahi hai. Admin panel agle stage mein banega. Tab tak test karne ke liye:

1. Firebase Console → Firestore Database → **"Start collection"**
2. Collection ID: `products`
3. Ek document add karo in fields ke saath:
   - `title` (string) → `B.Sc. B.Ed. 2nd Year (Bio) Notes`
   - `category` (string) → `B.Sc. B.Ed. 2nd Year`
   - `price` (number) → `49`
   - `mrp` (number) → `299`
   - `active` (boolean) → `true`
   - `featured` (boolean) → `true`
   - `images` (array) → khaali rehne do abhi (ya ek base64 image string daal sakte ho)
4. Save karo, website refresh karo — product card dikhne lagega

## ⚠️ Security note (important — later step mein lock karenge)

Firestore abhi "test mode" mein hai, matlab koi bhi internet se data padh/likh sakta hai. Yeh development ke liye theek hai, lekin **website live karne se pehle** hum proper security rules lagayenge taaki:
- Koi bhi customer sirf apna order create kar sake, doosron ka data na dekh sake
- Sirf aapka admin login hi products/orders/settings edit kar sake

Yeh main agle stages ke saath cover karunga jab admin panel ban jayega.
