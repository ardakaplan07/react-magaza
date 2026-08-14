import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// STRIPE PAKETLERİ (Yeni Eklendi)
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import './App.css';
import AdminBarcodeAdd from './pages/admin/AdminBarcodeAdd'
import QRPayment from './pages/QRPayment'; // QR ödeme bileşenimiz başarıyla import edilmiş
import MobilePay from './pages/MobilePay';

// --- STRIPE BAŞLATMA (Yeni Eklendi) ---
// VITE_ ile başlayan Publishable Key'i .env dosyasından çekiyoruz
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// --- VERİLER VE YAPILAR (Statik) ---
const megaMenuData = {
  "Kadın": [{ title: "Giyim", items: ["Tişört", "Gömlek", "Kaban", "Kot Pantolon", "Elbise"] }, { title: "Ayakkabı", items: ["Topuklu Ayakkabı", "Sneaker", "Sandalet"] }, { title: "Aksesuar & Çanta", items: ["Omuz Çantası", "Sırt Çantası", "Güneş Gözlüğü"] }],
  "Erkek": [{ title: "Giyim", items: ["Tişört", "Gömlek", "Ceket", "Pantolon", "Eşofman"] }, { title: "Ayakkabı", items: ["Spor Ayakkabı", "Klasik Ayakkabı", "Bot"] }, { title: "Saat & Aksesuar", items: ["Kol Saati", "Cüzdan", "Kemer"] }],
  "Elektronik": [{ title: "Bilgisayar & Donanım", items: ["Dizüstü Bilgisayar", "Monitör", "Depolama", "SSD"] }, { title: "Telefon & Aksesuar", items: ["Akıllı Telefon", "Kılıf", "Şarj Aleti"] }, { title: "Ev Elektroniği", items: ["Televizyon", "Ses Sistemleri"] }],
  "Takı & Aksesuar": [{ title: "Değerli Takı", items: ["Altın Yüzük", "Pırlanta", "Bilezik"] }, { title: "Moda Takı", items: ["Kolye", "Bileklik", "Küpe"] }],
  "Spor & Outdoor": [{ title: "Spor Giyim", items: ["Sweatshirt", "Tayt", "Şort"] }, { title: "Ekipman", items: ["Dambıl", "Mat", "Çadır"] }]
};

const stories = [
  { id: 1, title: 'Tümü', icon: '🐅' },
  { id: 2, title: 'Günün Fırsatı', icon: '⚡' },
  { id: 3, title: 'Kargo Bedava', icon: '🚚' },
  { id: 4, title: 'Çok Satanlar', icon: '🔥' },
  { id: 5, title: 'Dev İndirimler', icon: '🎁' }
];

const TigerLogo = ({ size = 45 }) => (
  <svg viewBox="0 0 512 512" style={{ width: size, height: size, fill: '#ff7a00' }} xmlns="http://www.w3.org/2000/svg">
    <path d="M473.1 161.4c-6.8-9.4-18.7-12.8-29.3-8.4l-38.4 16c-13.9 5.8-29.5 2.1-39.6-9.3l-28.8-32.6c-8-9.1-20.7-12.8-32.3-9.5-31.5 8.9-65.7 8.9-97.2 0-11.6-3.3-24.3.4-32.3 9.5l-28.8 32.6c-10.1 11.4-25.7 15.1-39.6 9.3l-38.4-16c-10.6-4.4-22.5-1-29.3 8.4-15 20.8-22.6 45.8-24.7 71.9-2.2 27.6 2.3 55.4 12.8 80.8 11.8 28.5 31.7 52.8 56.6 69.9 14.6 10 32.2 13.9 49.7 11l14.1-2.3c27.1-4.5 54.4 3.7 75.3 22.4l13.1 11.8c12.3 11 30.5 11 42.8 0l13.1-11.8c20.9-18.7 48.2-26.9 75.3-22.4l14.1 2.3c17.5 2.9 35.1-.9 49.7-11 24.9-17.1 44.8-41.4 56.6-69.9 10.5-25.4 15-53.2 12.8-80.8-2.1-26.1-9.7-51.1-24.7-71.9zm-155.2 78.4c-8.8 24.2-32.8 40.2-59.5 40.2h-4.8c-26.7 0-50.7-16-59.5-40.2l-5.6-15.5c-3.1-8.5 2.1-17.7 11.1-19 23-3.3 43-2.1 56.4-1.3 13.4-.8 33.4-2 56.4 1.3 9 1.3 14.2 10.5 11.1 19l-5.6 15.5zM256 384c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm85.3-195.4l18.5-20.9c5.1-5.7 13.8-6.6 20-2l16.1 11.9c6.3 4.7 6.9 13.9 1.2 19.3l-22.1 21c-5.8 5.5-15 4.6-19.6-1.7l-14.1-18.3c-4.4-5.8-3.7-14.3 2-19.1v-.2zm-229.2-22.9c6.2-4.6 14.9-3.7 20 2l18.5 20.9c5.7 4.8 6.4 13.3 2 19.1l-14.1 18.3c-4.6 6.3-13.8 7.2-19.6 1.7l-22.1-21c-5.7-5.4-5.1-14.6 1.2-19.3l14.1-11.7z" />
  </svg>
);

// --- DİJİTAL CÜZDAN VE KART BUTONU BİLEŞENİ ---
const AppleGooglePayButton = ({ totalAmount, cart, user, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements(); // Form verilerini yakalamak için eklendi
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false); // Buton bekleme efekti için eklendi

  useEffect(() => {
    if (stripe && totalAmount > 0) {
      const pr = stripe.paymentRequest({
        country: 'US',
        currency: 'usd',
        total: {
          label: 'Kaplan Store Sepet',
          amount: Math.round(totalAmount * 100), 
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then((result) => {
        if (result) {
          setPaymentRequest(pr);
        }
      });

      pr.on('paymentmethod', async (ev) => {
        try {
          // 1. Backend'den o güvenli "bileti" (client_secret) al
          const response = await fetch('https://kaplan-mocha.vercel.app//api/create-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: Math.round(totalAmount * 100) }),
          });
          const { clientSecret } = await response.json();

          // 2. Stripe üzerinden ödemeyi onayla
          const { error, paymentIntent } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (error) {
            ev.complete('fail');
            alert('Ödeme başarısız: ' + error.message);
          } else {
            ev.complete('success');
            
            // 3D Secure vb. ek aksiyon gerekirse
            if (paymentIntent.status === 'requires_action') {
              const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
              if (actionError) return alert('3D Secure onayı başarısız oldu.');
            }
            
            // 3. Ödeme alındı, Siparişi DB'ye kaydet
            const orderData = {
              userId: user?._id || null,
              customerName: ev.payerName || user?.fullName || 'Dijital Cüzdan Müşterisi',
              email: ev.payerEmail || user?.email || '',
              phone: ev.payerPhone || 'Belirtilmedi',
              address: 'Apple/Google Pay ile Hızlı Sipariş Edildi',
              city: 'Dijital Cüzdan',
              items: cart,
              totalAmount: totalAmount
            };

            const orderResponse = await fetch('https://kaplan-mocha.vercel.app//api/orders/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(orderData)
            });
            const data = await orderResponse.json();
            
            // Ana sayfaya (StoreFront) başarı durumunu yolla
            onSuccess({ ...data.order, ...orderData });
          }
        } catch (err) {
          ev.complete('fail');
          console.error("Ödeme işlenirken sunucu hatası:", err);
        }
      });
    }
  }, [stripe, totalAmount, cart, user, onSuccess]);

  // MANUEL KART GİRİŞİ İŞLEME FONKSİYONU
  const handleCardPayment = async () => {
    if (!stripe || !elements) return;

    setIsProcessing(true); // Butonu pasife al, işlem başlatıldı

    const cardElement = elements.getElement(CardElement);

    try {
      // 1. Backend'den ödeme yetkisini (Intent) al
      const response = await fetch('https://kaplan-mocha.vercel.app//api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Math.round(totalAmount * 100) }),
      });
      
      if (!response.ok) throw new Error("Ödeme isteği oluşturulamadı.");
      const { clientSecret } = await response.json();

      // 2. Kredi Kartı ile ödemeyi onayla
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.fullName || 'Misafir Müşteri',
            email: user?.email || '',
          },
        },
      });

      if (error) {
        console.error("Kart Hatası:", error.message);
        alert("Ödeme Hatası: Kart bilgilerini kontrol ediniz.");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        
        // 3. Başarılı olduysa, Siparişi DB'ye kaydet
        const orderData = {
          userId: user?._id || null,
          customerName: user?.fullName || 'Stripe Müşterisi',
          email: user?.email || '',
          phone: 'Stripe - Belirtilmedi',
          address: 'Stripe Kredi Kartı (Manuel) ile Ödendi',
          city: 'Stripe',
          items: cart,
          totalAmount: totalAmount
        };

        const orderResponse = await fetch('https://kaplan-mocha.vercel.app//api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderData)
        });
        const data = await orderResponse.json();
        
        // 4. Sepeti sıfırla ve başarı ekranına geç
        onSuccess({ ...data.order, ...orderData });
      }
    } catch (error) {
      console.error("İşlem hatası:", error);
      alert("Sunucuyla bağlantı kurulamadı.");
      setIsProcessing(false);
    }
  };

  // KART FORMU İÇİN TASARIM AYARLARI
  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#32325d',
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: 'antialiased',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
      },
    },
    hidePostalCode: true,
  };

  // Eğer tarayıcıda/cihazda destekli cüzdan yoksa (B PLANI + MANUEL KART)
  if (!paymentRequest) {
    return (
      <div style={{ marginTop: '15px' }}>
        {/* B Planı: Bilgi Butonu */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
            <span style={{ margin: '0 10px', color: '#888', fontSize: '12px', fontWeight: 'bold' }}>VEYA HIZLI ÖDE</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
          </div>
          <button disabled style={{ width: '100%', padding: '12px', backgroundColor: '#222', color: '#666', border: '1px dashed #444', borderRadius: '6px', cursor: 'not-allowed', fontSize: '14px' }}>
             Tarayıcınızda Dijital Cüzdan Bulunamadı 💳
          </button>
          <p style={{fontSize: '11px', color: '#555', marginTop: '8px', lineHeight: '1.4', marginBottom: '20px'}}>
            Hızlı ödeme için Chrome'da senkronize bir Google Pay hesabı veya Mac/Safari'de Apple Pay gereklidir.
          </p>
        </div>

        {/* Klasik Kredi Kartı Formu */}
        <div style={{ padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333' }}>
          <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>Kredi veya Banka Kartı ile Öde</p>
          <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '5px' }}>
            <CardElement options={cardElementOptions} />
          </div>
          <button 
            onClick={handleCardPayment}
            disabled={isProcessing}
            style={{ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: isProcessing ? '#0a804d' : '#00c65e', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: isProcessing ? 'not-allowed' : 'pointer', transition: '0.3s' }}
          >
            {isProcessing ? 'Ödeme İşleniyor...' : 'Kart ile Güvenli Öde'}
          </button>
        </div>
      </div>
    );
  }

  // Eğer cüzdan varsa (APPLE/GOOGLE PAY + MANUEL KART)
  return (
    <div style={{ marginTop: '15px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
        <span style={{ margin: '0 10px', color: '#888', fontSize: '12px', fontWeight: 'bold' }}>VEYA HIZLI ÖDE</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
      </div>
      <PaymentRequestButtonElement options={{ paymentRequest }} />
      
      {/* Cüzdanı olsa bile belki başka kartla ödemek ister, altına klasik formu da koyalım */}
      <div style={{ marginTop: '25px', padding: '15px', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333' }}>
        <p style={{ color: '#ccc', fontSize: '13px', marginBottom: '10px', fontWeight: 'bold' }}>Farklı Bir Kart Kullan</p>
        <div style={{ padding: '12px', backgroundColor: '#fff', borderRadius: '5px' }}>
          <CardElement options={cardElementOptions} />
        </div>
        <button 
          onClick={handleCardPayment}
          disabled={isProcessing}
          style={{ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: isProcessing ? '#0a804d' : '#00c65e', color: 'white', fontWeight: 'bold', border: 'none', borderRadius: '5px', cursor: isProcessing ? 'not-allowed' : 'pointer' }}
        >
          {isProcessing ? 'Ödeme İşleniyor...' : 'Kart ile Güvenli Öde'}
        </button>
      </div>
    </div>
  );
};  

// ==========================================
// 1. GERÇEK VERİ İLE GİRİŞ VE KAYIT EKRANI
// ==========================================
function AuthScreen({ onAuth }) {
  const [isLogin, setIsLogin] = useState(true); 
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setLoading(true);

    if (!isLogin && password !== passwordConfirm) {
      setMessage({ type: 'error', text: 'Şifreler birbiriyle uyuşmuyor!' });
      setLoading(false);
      return;
    }

    try {
      const endpoint = isLogin ? 'https://kaplan-mocha.vercel.app/api/auth/login' : 'https://kaplan-mocha.vercel.app//api/auth/register';
      const bodyData = isLogin ? { email, password } : { fullName, email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();

      if (response.ok) {
        if (isLogin) {
          onAuth(data.user.role, data.user, data.token);
        } else {
          setMessage({ type: 'success', text: data.message });
          setIsLogin(true);
          setPassword('');
          setPasswordConfirm('');
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Bir hata oluştu.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Sunucuya bağlanılamadı. Lütfen sunucunuzun açık olduğundan emin olun.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#121212', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui' }}>
      <div style={{ backgroundColor: '#1a1a1a', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
          <TigerLogo size={60} />
          <h1 style={{ color: '#fff', fontSize: '24px', margin: '10px 0 0 0' }}>KAPLAN<span style={{ color: '#ff7a00' }}>STORE</span></h1>
          <p style={{ color: '#888', margin: '5px 0 0 0', fontSize: '14px' }}>
            {isLogin ? 'Tekrar Hoş Geldiniz' : 'Vahşi Dünyaya Katılın'}
          </p>
        </div>

        {message.text && (
          <div style={{ padding: '12px', marginBottom: '20px', borderRadius: '6px', fontSize: '14px', textAlign: 'center', 
            backgroundColor: message.type === 'error' ? 'rgba(255, 68, 68, 0.1)' : 'rgba(11, 163, 96, 0.1)',
            color: message.type === 'error' ? '#ff4444' : '#0BA360',
            border: `1px solid ${message.type === 'error' ? '#ff4444' : '#0BA360'}` }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {!isLogin && (
            <input type="text" placeholder="Ad Soyad" required value={fullName} onChange={e => setFullName(e.target.value)}
              style={{ padding: '15px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontSize: '14px', outline: 'none' }} />
          )}
          <input type="email" placeholder="E-Posta Adresi" required value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontSize: '14px', outline: 'none' }} />
          <input type="password" placeholder="Şifre" required value={password} onChange={e => setPassword(e.target.value)}
            style={{ padding: '15px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontSize: '14px', outline: 'none' }} />
          {!isLogin && (
            <input type="password" placeholder="Şifre (Tekrar)" required value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)}
              style={{ padding: '15px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontSize: '14px', outline: 'none' }} />
          )}
          <button type="submit" disabled={loading}
            style={{ marginTop: '10px', padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: '#ff7a00', color: '#000', fontWeight: 'bold', fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: '0.2s' }}>
            {loading ? 'İşleniyor...' : (isLogin ? 'Giriş Yap' : 'Hesap Oluştur')}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <span style={{ color: '#888', fontSize: '13px' }}>
            {isLogin ? 'Hesabın yok mu? ' : 'Zaten hesabın var mı? '}
          </span>
          <span 
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage({ type: '', text: '' });
            }}
            style={{ color: '#ff7a00', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
            {isLogin ? 'Hemen Kayıt Ol' : 'Giriş Yap'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. YÖNETİCİ PANELİ (ADMIN DASHBOARD)
// ==========================================
function AdminDashboard({ onLogout, user }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminProducts, setAdminProducts] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]); 
  const [adminOrders, setAdminOrders] = useState([]);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null); 
  const [discountInputs, setDiscountInputs] = useState({});
  const [bulkJson, setBulkJson] = useState('');
  const [editingCategories, setEditingCategories] = useState({});
  const [stats, setStats] = useState({ totalUsers: 0, totalProducts: 0, totalRevenue: 0, activeOrders: 0 });
  const [productForm, setProductForm] = useState({
    title: '', category: '', subCategory: '', price: '', stock: '', description: '', image: '',
    isFreeShipping: false, isBestSeller: false, isDealOfTheDay: false
  });

  const fetchStats = async () => {
    try {
      const response = await fetch('https://kaplan-mocha.vercel.app//api/admin/stats'); 
      if (response.ok) setStats(await response.json());
    } catch (error) { console.error("İstatistikler çekilemedi:", error); }
  };

  const fetchAdminProducts = async () => {
    try {
      const response = await fetch('https://kaplan-mocha.vercel.app//api/products/all');
      if (response.ok) setAdminProducts(await response.json());
    } catch (error) { console.error("Ürünler çekilemedi:", error); }
  };

  const fetchAdminUsers = async () => {
    try {
      const response = await fetch('https://kaplan-mocha.vercel.app//api/admin/users');
      if (response.ok) setAdminUsers(await response.json());
    } catch (error) { console.error("Kullanıcılar çekilemedi:", error); }
  };

  const fetchAdminOrders = async () => {
    try {
        const response = await fetch('https://kaplan-mocha.vercel.app//api/admin/orders');
        if(response.ok) setAdminOrders(await response.json());
    } catch (error) { console.error("Siparişler çekilemedi:", error); }
  };

  useEffect(() => {
    fetchStats();
    fetchAdminProducts();
    fetchAdminUsers(); 
    fetchAdminOrders();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProductForm({ ...productForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAddProduct = async () => {
    if (!productForm.title || !productForm.category || !productForm.price) return alert("Ad, kategori ve fiyat zorunlu!");
    try {
      const response = await fetch('https://kaplan-mocha.vercel.app//api/admin/add-product', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productForm),
      });
      if (response.ok) {
        alert("Ürün başarıyla eklendi!");
        setProductForm({ title: '', category: '', subCategory: '', price: '', stock: '', description: '', image: '', isFreeShipping: false, isBestSeller: false, isDealOfTheDay: false });
        fetchStats(); fetchAdminProducts(); 
      }
    } catch (error) { alert("Sunucuya ulaşılamadı."); }
  };

  const handleBulkAdd = async () => {
    if(!bulkJson.trim()) return alert("Lütfen yapıştırılacak ürün kodlarını girin!");
    try {
      const parsedData = JSON.parse(bulkJson);
      if (!Array.isArray(parsedData)) return alert("Geçerli bir liste formatında değil.");
      const response = await fetch('https://kaplan-mocha.vercel.app//api/admin/bulk-add-products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ products: parsedData })
      });
      if (response.ok) {
        alert(`${parsedData.length} ürün başarıyla eklendi!`);
        setBulkJson(''); fetchStats(); fetchAdminProducts();
      }
    } catch (error) { alert("Kopyaladığınız verinin formatı bozuk!"); }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    try {
      const response = await fetch(`https://kaplan-mocha.vercel.app//api/admin/delete-product/${productId}`, { method: 'DELETE' });
      if (response.ok) { fetchAdminProducts(); fetchStats(); }
    } catch (error) { alert("Sunucuya ulaşılamadı."); }
  };

  const handleApplyDiscount = async (productId) => {
    const discountVal = discountInputs[productId];
    if (discountVal === undefined || discountVal === '') return alert("İndirim oranı girin!");
    try {
      const response = await fetch(`https://kaplan-mocha.vercel.app//api/admin/update-discount/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ discountPercentage: discountVal })
      });
      if (response.ok) { fetchAdminProducts(); setDiscountInputs({ ...discountInputs, [productId]: '' }); }
    } catch (error) { alert("Sunucuya ulaşılamadı."); }
  };

  const handleToggleProductFlag = async (productId, flagName, currentValue) => {
    try {
      const response = await fetch(`https://kaplan-mocha.vercel.app//api/admin/update-product-flags/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ flagName, value: !currentValue })
      });
      if (response.ok) fetchAdminProducts(); 
    } catch (error) { console.error("Özellik güncellenemedi"); }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Kullanıcıyı ${newRole.toUpperCase()} yapmak istediğinize emin misiniz?`)) return;
    try {
      const response = await fetch(`https://kaplan-mocha.vercel.app//api/admin/update-role/${userId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: newRole })
      });
      if (response.ok) fetchAdminUsers(); 
    } catch (error) { console.error("Yetki değiştirilemedi"); }
  };

  const startEditingCategory = (product) => {
    setEditingCategories({
      ...editingCategories,
      [product._id]: { category: product.category, subCategory: product.subCategory }
    });
  };

  const handleCategoryInputChange = (productId, field, value) => {
    setEditingCategories({
      ...editingCategories,
      [productId]: { ...editingCategories[productId], [field]: value }
    });
  };

  const saveCategory = async (productId) => {
    const { category, subCategory } = editingCategories[productId];
    try {
      const response = await fetch(`https://kaplan-mocha.vercel.app//api/admin/update-category/${productId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ category, subCategory })
      });
      if (response.ok) {
        fetchAdminProducts(); 
        const newEdits = { ...editingCategories };
        delete newEdits[productId]; 
        setEditingCategories(newEdits);
      }
    } catch (error) { alert("Kategori güncellenemedi."); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#121212', fontFamily: 'system-ui', color: '#fff' }}>
      
      {/* SİPARİŞ DETAY MODALI (Mevcut kodun aynısı) */}
      {selectedOrderDetails && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setSelectedOrderDetails(null)}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '600px', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#ff7a00' }}>Sipariş Detayı #{selectedOrderDetails._id ? selectedOrderDetails._id.substring(0,8).toUpperCase() : 'N/A'}</h2>
              <button onClick={() => setSelectedOrderDetails(null)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}>✖</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#222', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Müşteri & İletişim</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Ad Soyad:</strong> {selectedOrderDetails.customerName}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>E-Posta:</strong> {selectedOrderDetails.email}</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Telefon:</strong> {selectedOrderDetails.phone || 'Belirtilmedi'}</p>
              </div>
              <div style={{ backgroundColor: '#222', padding: '15px', borderRadius: '8px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Ödeme Bilgisi</h4>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Tutar:</strong> <span style={{color: '#0BA360'}}>${selectedOrderDetails.totalAmount?.toFixed(2)}</span></p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Durum:</strong> 3D Secure / Stripe Onaylı</p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}><strong>Tarih:</strong> {new Date(selectedOrderDetails.createdAt).toLocaleString('tr-TR')}</p>
              </div>
            </div>

            <div style={{ backgroundColor: '#222', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Teslimat Adresi</h4>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>{selectedOrderDetails.address || 'Adres bilgisi bulunamadı.'} - {selectedOrderDetails.city || ''}</p>
            </div>

            <h4 style={{ margin: '0 0 10px 0', color: '#aaa' }}>Satın Alınan Ürünler</h4>
            <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid #333', borderRadius: '8px', padding: '10px' }}>
              {selectedOrderDetails.items?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px dashed #333' }}>
                  <span style={{ fontSize: '14px' }}>{item.title} (x{item.quantity})</span>
                  <span style={{ fontWeight: 'bold' }}>${((item.discountPercentage > 0 ? item.discountedPrice : item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SOL MENÜ (Buraya Barkod sekmesi eklendi) */}
      <div style={{ width: '250px', backgroundColor: '#000', borderRight: '1px solid #333', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>ADMIN<span style={{color: '#ff7a00'}}>PANEL</span></h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <button onClick={() => setActiveTab('dashboard')} style={{ backgroundColor: activeTab === 'dashboard' ? '#ff7a00' : 'transparent', color: activeTab === 'dashboard' ? '#000' : '#aaa', border: 'none', padding: '12px', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>📊 Dashboard</button>
          
          {/* YENİ EKLENEN BARKOD SEKMESİ */}
          <button onClick={() => setActiveTab('barcode')} style={{ backgroundColor: activeTab === 'barcode' ? '#ff7a00' : 'transparent', color: activeTab === 'barcode' ? '#000' : '#aaa', border: 'none', padding: '12px', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>📸 Hızlı Ekle (Barkod)</button>
          
          <button onClick={() => setActiveTab('products')} style={{ backgroundColor: activeTab === 'products' ? '#ff7a00' : 'transparent', color: activeTab === 'products' ? '#000' : '#aaa', border: 'none', padding: '12px', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>📦 Ürün Yönetimi</button>
          <button onClick={() => setActiveTab('users')} style={{ backgroundColor: activeTab === 'users' ? '#ff7a00' : 'transparent', color: activeTab === 'users' ? '#000' : '#aaa', border: 'none', padding: '12px', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>👥 Kullanıcı Yönetimi</button>
          <button onClick={() => {setActiveTab('sales'); fetchAdminOrders();}} style={{ backgroundColor: activeTab === 'sales' ? '#ff7a00' : 'transparent', color: activeTab === 'sales' ? '#000' : '#aaa', border: 'none', padding: '12px', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>💰 Satışlar (Siparişler)</button>
          <button onClick={() => setActiveTab('settings')} style={{ backgroundColor: activeTab === 'settings' ? '#ff7a00' : 'transparent', color: activeTab === 'settings' ? '#000' : '#aaa', border: 'none', padding: '12px', borderRadius: '6px', textAlign: 'left', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s' }}>⚙️ Ayarlar</button>
        </div>
        <button onClick={onLogout} style={{ backgroundColor: '#222', color: '#ff4444', border: '1px solid #444', padding: '12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Çıkış Yap</button>
      </div>

      {/* SAĞ İÇERİK ALANI */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* DASHBOARD SEKMESİ */}
        {activeTab === 'dashboard' && (
          <>
            <h1 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>Hoş Geldin, {user?.fullName || 'Yönetici'}</h1>
            <p style={{ color: '#888', margin: '0 0 30px 0' }}>Sistemlerin genel durumu aşağıdadır.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '10px', border: '1px solid #333', borderLeft: '4px solid #0BA360' }}>
                <p style={{ margin: '0 0 10px 0', color: '#888', fontSize: '14px' }}>Toplam Gelir</p>
                <h2 style={{ margin: 0, fontSize: '28px', color: '#fff' }}>{stats.totalRevenue.toLocaleString()} $</h2>
              </div>
              <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '10px', border: '1px solid #333', borderLeft: '4px solid #ff7a00' }}>
                <p style={{ margin: '0 0 10px 0', color: '#888', fontSize: '14px' }}>Aktif Siparişler</p>
                <h2 style={{ margin: 0, fontSize: '28px', color: '#fff' }}>{stats.activeOrders} Adet</h2>
              </div>
              <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '10px', border: '1px solid #333', borderLeft: '4px solid #4287f5' }}>
                <p style={{ margin: '0 0 10px 0', color: '#888', fontSize: '14px' }}>Toplam Kullanıcı</p>
                <h2 style={{ margin: 0, fontSize: '28px', color: '#fff' }}>{stats.totalUsers}</h2>
              </div>
              <div style={{ backgroundColor: '#1a1a1a', padding: '25px', borderRadius: '10px', border: '1px solid #333', borderLeft: '4px solid #e3242b' }}>
                <p style={{ margin: '0 0 10px 0', color: '#888', fontSize: '14px' }}>Sistemdeki Ürünler</p>
                <h2 style={{ margin: 0, fontSize: '28px', color: '#fff' }}>{stats.totalProducts}</h2>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {/* TEKLİ ÜRÜN EKLEME */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
                  <h3 style={{ margin: '0 0 20px 0', color: '#ff7a00' }}>Yeni Ürün Ekle (Tekli)</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <input type="text" name="title" value={productForm.title} onChange={handleInputChange} placeholder="Ürün Adı" style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }} />
                    <select name="category" value={productForm.category} onChange={handleInputChange} style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}>
                      <option value="">Ana Kategori Seçin</option>
                      <option value="Kadın">Kadın</option>
                      <option value="Erkek">Erkek</option>
                      <option value="Elektronik">Elektronik</option>
                      <option value="Takı & Aksesuar">Takı & Aksesuar</option>
                      <option value="Spor & Outdoor">Spor & Outdoor</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <input type="text" name="subCategory" value={productForm.subCategory} onChange={handleInputChange} placeholder="Alt Kategori (Örn: Pantolon)" style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }} />
                    <input type="text" name="image" value={productForm.image} onChange={handleInputChange} placeholder="Görsel Linki (https://...)" style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                    <input type="number" name="price" value={productForm.price} onChange={handleInputChange} placeholder="Fiyat ($)" style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }} />
                    <input type="number" name="stock" value={productForm.stock} onChange={handleInputChange} placeholder="Stok Adedi" style={{ padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '15px', padding: '15px', backgroundColor: '#222', borderRadius: '6px', border: '1px solid #444' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" name="isFreeShipping" checked={productForm.isFreeShipping} onChange={handleInputChange} /> Kargo Bedava</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" name="isBestSeller" checked={productForm.isBestSeller} onChange={handleInputChange} /> Çok Satanlar</label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><input type="checkbox" name="isDealOfTheDay" checked={productForm.isDealOfTheDay} onChange={handleInputChange} /> Günün Fırsatı</label>
                  </div>
                  <textarea name="description" value={productForm.description} onChange={handleInputChange} placeholder="Ürün Açıklaması Detayları..." rows="3" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', marginBottom: '15px', boxSizing: 'border-box' }}></textarea>
                  <button onClick={handleAddProduct} style={{ backgroundColor: '#ff7a00', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Ürünü Sisteme Yükle</button>
                </div>

                {/* TOPLU ÜRÜN YÜKLEME */}
                <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', border: '1px solid #333' }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#4287f5' }}>⚡ Toplu Ürün Yükleme (Bot/JSON)</h3>
                  <p style={{ color: '#888', fontSize: '13px', marginBottom: '15px' }}>Diğer sitelerden çektiğin (kopyaladığın) ürün kodlarını buraya yapıştırıp tek tıkla onlarca ürünü mağazana ekleyebilirsin.</p>
                  <textarea value={bulkJson} onChange={(e) => setBulkJson(e.target.value)} placeholder='[ { "title": "Erkek Gömlek", "price": 250, "image": "http..." }, ... ]' rows="6" style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', fontFamily: 'monospace', fontSize: '13px', marginBottom: '15px', boxSizing: 'border-box' }}></textarea>
                  <button onClick={handleBulkAdd} style={{ backgroundColor: '#4287f5', color: '#fff', border: 'none', padding: '15px 30px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}>Sihri Gerçekleştir (Tümünü Yükle)</button>
                </div>
              </div>

              {/* CANLI SON İŞLEMLER */}
              <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '10px', border: '1px solid #333', height: 'fit-content' }}>
                <h3 style={{ margin: '0 0 20px 0', color: '#ff7a00' }}>Canlı Son İşlemler</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {adminOrders.slice(0,5).map((o, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid #333' }}>
                      <div>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>Sipariş #{o._id ? o._id.substring(0,6).toUpperCase() : '9844'}</p>
                        <span style={{ fontSize: '12px', color: '#888' }}>{o.customerName}</span>
                      </div>
                      <span style={{ color: '#0BA360', fontWeight: 'bold' }}>+ ${o.totalAmount?.toFixed(2)}</span>
                    </div>
                  ))}
                  {adminOrders.length === 0 && <p style={{color: '#888', fontSize: '13px'}}>Henüz sipariş yok.</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* YENİ EKLENEN BARKOD SEKMESİ İÇERİĞİ */}
        {activeTab === 'barcode' && (
          <div style={{ paddingBottom: '30px' }}>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '28px', color: '#ff7a00' }}>QR ve Barkod Yönetimi</h1>
            {/* Az önce import ettiğimiz komponenti buraya sekmeye entegre ediyoruz */}
            <AdminBarcodeAdd />
          </div>
        )}

        {/* ÜRÜN YÖNETİMİ SEKMESİ */}
        {activeTab === 'products' && (
          <>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '28px', color: '#ff7a00' }}>Ürün ve Vitrin Yönetimi</h1>
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px solid #333', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#000', color: '#aaa', fontSize: '14px' }}>
                  <tr>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>Ürün Bilgisi</th>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>Fiyat & İndirim</th>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>İndirim Ata</th>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>Vitrin Etiketleri</th>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333', textAlign: 'right' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {adminProducts.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <img src={p.image || 'https://via.placeholder.com/50'} alt={p.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div>
                          <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#fff', maxWidth: '200px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{p.title}</p>
                          {editingCategories[p._id] ? (
                            <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                              <input type="text" value={editingCategories[p._id].category} onChange={(e) => handleCategoryInputChange(p._id, 'category', e.target.value)} placeholder="Ana Kategori" style={{ width: '80px', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}/>
                              <input type="text" value={editingCategories[p._id].subCategory} onChange={(e) => handleCategoryInputChange(p._id, 'subCategory', e.target.value)} placeholder="Alt Kategori" style={{ width: '80px', padding: '4px', fontSize: '11px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}/>
                              <button onClick={() => saveCategory(p._id)} style={{ backgroundColor: '#0BA360', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Kaydet</button>
                              <button onClick={() => { const newEdits = {...editingCategories}; delete newEdits[p._id]; setEditingCategories(newEdits); }} style={{ backgroundColor: '#333', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>✖</button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '12px', color: '#888', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {p.category} &gt; {p.subCategory}
                              <span onClick={() => startEditingCategory(p)} style={{ cursor: 'pointer', fontSize: '14px' }} title="Kategoriyi Düzenle">✏️</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>${p.price?.toFixed(2)}</div>
                        {p.discountPercentage > 0 && <span style={{ color: '#ff0000', fontSize: '12px', fontWeight: 'bold', display: 'block', marginTop: '5px' }}>%{p.discountPercentage} İndirimli</span>}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input type="number" min="0" max="100" placeholder="%" value={discountInputs[p._id] || ''} onChange={(e) => setDiscountInputs({ ...discountInputs, [p._id]: e.target.value })} style={{ width: '50px', padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }} />
                          <button onClick={() => handleApplyDiscount(p._id)} style={{ backgroundColor: '#0BA360', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Uygula</button>
                        </div>
                      </td>
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span onClick={() => handleToggleProductFlag(p._id, 'isFreeShipping', p.isFreeShipping)} style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: p.isFreeShipping ? '#333' : 'transparent', border: p.isFreeShipping ? '1px solid #555' : '1px dashed #444', color: p.isFreeShipping ? '#fff' : '#555' }}>🚚 Kargo</span>
                          <span onClick={() => handleToggleProductFlag(p._id, 'isBestSeller', p.isBestSeller)} style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: p.isBestSeller ? '#ff7a00' : 'transparent', border: p.isBestSeller ? '1px solid #ff7a00' : '1px dashed #444', color: p.isBestSeller ? '#000' : '#555' }}>🔥 Satan</span>
                          <span onClick={() => handleToggleProductFlag(p._id, 'isDealOfTheDay', p.isDealOfTheDay)} style={{ cursor: 'pointer', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', backgroundColor: p.isDealOfTheDay ? '#0BA360' : 'transparent', border: p.isDealOfTheDay ? '1px solid #0BA360' : '1px dashed #444', color: p.isDealOfTheDay ? '#fff' : '#555' }}>⚡ Fırsat</span>
                        </div>
                      </td>
                      <td style={{ padding: '15px', textAlign: 'right' }}>
                        <button onClick={() => handleDeleteProduct(p._id)} style={{ backgroundColor: '#ff4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Sil 🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* KULLANICI YÖNETİMİ */}
        {activeTab === 'users' && (
          <>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '28px', color: '#ff7a00' }}>Kullanıcı ve Yetki Yönetimi</h1>
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px solid #333', overflow: 'hidden' }}>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
               <thead style={{ backgroundColor: '#000', color: '#aaa', fontSize: '14px' }}>
                 <tr><th style={{ padding: '15px' }}>Ad Soyad</th><th style={{ padding: '15px' }}>E-Posta Adresi</th><th style={{ padding: '15px' }}>Mevcut Yetki</th><th style={{ padding: '15px', textAlign: 'right' }}>İşlem</th></tr>
               </thead>
               <tbody>
                 {adminUsers.map(u => (
                   <tr key={u._id} style={{ borderBottom: '1px solid #222' }}>
                     <td style={{ padding: '15px', fontWeight: 'bold', color: '#fff' }}>{u.fullName}</td><td style={{ padding: '15px', color: '#aaa' }}>{u.email}</td>
                     <td style={{ padding: '15px' }}>{u.role === 'admin' ? <span style={{ backgroundColor: '#ff7a00', color: '#000', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>Admin</span> : <span style={{ backgroundColor: '#333', color: '#ccc', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' }}>User</span>}</td>
                     <td style={{ padding: '15px', textAlign: 'right' }}><button onClick={() => handleToggleRole(u._id, u.role)} style={{ backgroundColor: u.role === 'admin' ? '#333' : '#ff7a00', color: u.role === 'admin' ? '#fff' : '#000', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>{u.role === 'admin' ? 'Yetkiyi Al' : 'Yönetici Yap'}</button></td>
                   </tr>
                 ))}
               </tbody>
             </table>
            </div>
          </>
        )}

        {/* SATIŞLAR (SİPARİŞLER) SEKMESİ */}
        {activeTab === 'sales' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ margin: 0, fontSize: '28px', color: '#ff7a00' }}>Satış Raporları</h1>
              <button onClick={fetchAdminOrders} style={{ backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>🔄 Yenile</button>
            </div>
            
            <div style={{ backgroundColor: '#1a1a1a', borderRadius: '10px', border: '1px solid #333', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#000', color: '#aaa', fontSize: '14px' }}>
                  <tr>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>İşlem ID</th>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>Müşteri</th>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>Tutar</th>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333' }}>Durum</th>
                    <th style={{ padding: '15px', borderBottom: '1px solid #333', textAlign: 'center' }}>Detay</th>
                  </tr>
                </thead>
                <tbody>
                  {adminOrders.length > 0 ? adminOrders.map((o, idx) => (
                    <tr key={o._id || idx} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '15px', color: '#ff7a00', fontFamily: 'monospace', fontWeight: 'bold' }}>{o.transactionId || ('TRX_' + (984400+idx))}</td>
                      <td style={{ padding: '15px', fontWeight: 'bold', color: '#fff' }}>{o.customerName}</td>
                      <td style={{ padding: '15px', color: '#0BA360', fontWeight: 'bold' }}>${o.totalAmount?.toFixed(2)}</td>
                      <td style={{ padding: '15px' }}><span style={{ backgroundColor: 'rgba(11, 163, 96, 0.2)', color: '#0BA360', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #0BA360' }}>{o.status || 'Ödendi'}</span></td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button onClick={() => setSelectedOrderDetails(o)} style={{ backgroundColor: '#333', color: '#fff', border: '1px solid #555', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>İncele 🔍</button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Henüz yapılmış bir satış bulunmuyor.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* AYARLAR */}
        {activeTab === 'settings' && (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#888' }}><span style={{ fontSize: '60px', marginBottom: '20px' }}>⚙️</span><h2>Sistem Ayarları</h2></div>)}

      </div>
    </div>
  );
}

// ==========================================
// 3. EKSİK OLAN ÜRÜN KARTI BİLEŞENİ (ProductCard)
// ==========================================
function ProductCard({ product, onAddToCart, onProductClick, isFavorite, toggleFavorite }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}
      onClick={() => onProductClick(product)}
      style={{ border: isHovered ? '2px solid #ff7a00' : '2px solid #333', borderRadius: '8px', backgroundColor: '#1a1a1a', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.3s ease', overflow: 'hidden' }}>

      <div style={{ position: 'relative', backgroundColor: '#fff', height: '260px' }}>
        <img src={product.image} alt={product.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <button onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }} style={{ position: 'absolute', top: '10px', right: '10px', background: '#fff', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
        <div>
          <h3 style={{ fontSize: '14px', color: '#fff', margin: '0 0 10px 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.title}</h3>
          {product.discountPercentage > 0 ? (
            <div>
              <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '12px' }}>{product.price.toFixed(2)} $</span>
              <p style={{ color: '#ff7a00', fontWeight: 'bold', fontSize: '18px', margin: '5px 0 10px 0' }}>{product.discountedPrice.toFixed(2)} $</p>
            </div>
          ) : (
            <p style={{ color: '#ff7a00', fontWeight: 'bold', fontSize: '18px', margin: '0 0 10px 0' }}>{product.price.toFixed(2)} $</p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button onClick={(e) => { e.stopPropagation(); onAddToCart(product, 1); }} style={{ flex: 1, backgroundColor: '#ff7a00', color: '#000', border: 'none', padding: '10px 0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Sepete Ekle</button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAĞAZA VİTRİNİ
// ==========================================
function StoreFront({ onLogout, user }) {
  const [products, setProducts] = useState([]);
  const [categories] = useState(Object.keys(megaMenuData));
  const [selectedCategory, setSelectedCategory] = useState('Tümü'); 
  const [subCategoryFilter, setSubCategoryFilter] = useState(''); 
  const [activeStory, setActiveStory] = useState('Tümü');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showQR, setShowQR] = useState(false); // YENİ: QR ekranını kontrol eden state
  
  // YENİ: Siparişlerim Modalı State'leri
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState('Kadın');
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // --- LOCAL STORAGE (Kalıcı Sepet ve Favoriler) ---
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem(`kaplan_cart_${user?._id || 'guest'}`);
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [favorites, setFavorites] = useState(() => {
    const savedFavs = localStorage.getItem(`kaplan_favs_${user?._id || 'guest'}`);
    return savedFavs ? JSON.parse(savedFavs) : [];
  });

  useEffect(() => {
    localStorage.setItem(`kaplan_cart_${user?._id || 'guest'}`, JSON.stringify(cart));
  }, [cart, user]);

  useEffect(() => {
    localStorage.setItem(`kaplan_favs_${user?._id || 'guest'}`, JSON.stringify(favorites));
  }, [favorites, user]);
  // ------------------------------------------------

  // ÖDEME VE 3D SECURE STATE'LERİ
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false); 
  const [is3DSecureOpen, setIs3DSecureOpen] = useState(false); 
  const [otpCode, setOtpCode] = useState(''); 
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: user?.fullName || '', email: user?.email || '', phone: '', address: '', city: 'İstanbul'
  });
  
  const [completedOrder, setCompletedOrder] = useState(null);

  useEffect(() => {
    const fetchRealProducts = async () => {
      try {
        const response = await fetch('https://kaplan-mocha.vercel.app//api/products/all');
        if (response.ok) {
          const data = await response.json();
          const adaptedProducts = data.map(p => {
            const price = p.price || 0;
            const discountPercentage = p.discountPercentage || 0;
            const discountedPrice = price - (price * (discountPercentage / 100));
            return {
              ...p, id: p._id, image: p.image || 'https://via.placeholder.com/300x400/222222/ff7a00?text=KAPLAN+STORE',
              trCategory: p.category, mockSubCategory: p.subCategory || 'Genel',
              rating: { rate: 5, count: Math.floor(Math.random() * 50) + 10 }, 
              price: price, discountPercentage: discountPercentage, discountedPrice: discountedPrice
            };
          });
          setProducts(adaptedProducts);
        }
      } catch (error) {
        console.error("Ürünler çekilirken hata oluştu:", error);
      } finally { setLoading(false); }
    };
    fetchRealProducts();
  }, []);

  const toggleFavorite = (id) => setFavorites(prev => prev.includes(id) ? prev.filter(favId => favId !== id) : [...prev, id]);
  const addToCart = (product, quantity) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) return prevCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prevCart, { ...product, quantity }];
    });
  };
  const updateCartQuantity = (id, change) => setCart(prevCart => prevCart.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item));
  const removeFromCart = (id) => setCart(prevCart => prevCart.filter(item => item.id !== id));

  const totalOriginalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalFinalPrice = cart.reduce((sum, item) => sum + ((item.discountPercentage > 0 ? item.discountedPrice : item.price) * item.quantity), 0);
  const totalDiscount = totalOriginalPrice - totalFinalPrice;
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleStartCheckout = () => {
    if (cart.length === 0) return alert("Sepetiniz boş, lütfen ürün ekleyin!");
    setIsCartOpen(false);
    setShowQR(false); // Her ihtimale karşı sıfırla
    setIsAddressFormOpen(true); 
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    setIsAddressFormOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleInitiate3DSecure = async (e) => {
    e.preventDefault();
    setIsCheckoutOpen(false); 
    setIs3DSecureOpen(true);  
    setOtpCode(''); 

    try {
        await fetch('https://kaplan-mocha.vercel.app//api/payment/send-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                phone: customerDetails.phone, 
                customerName: customerDetails.name,
                totalAmount: totalFinalPrice.toFixed(2)
            })
        });
    } catch (error) {
        console.error("SMS tetiklenemedi:", error);
    }
  };

  const handleVerify3DSecure = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) return alert("Lütfen 6 haneli kodu eksiksiz girin!");

    setPaymentLoading(true);

    try {
        const verifyResponse = await fetch('https://kaplan-mocha.vercel.app//api/payment/verify-sms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: customerDetails.phone, otpCode: otpCode })
        });
        
        const verifyData = await verifyResponse.json();

        if (!verifyData.success) {
            alert(verifyData.message); 
            setPaymentLoading(false);
            return; 
        }

        const orderData = {
            userId: user?._id || null,
            customerName: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone,
            address: customerDetails.address,
            city: customerDetails.city,
            items: cart,
            totalAmount: totalFinalPrice
        };

        const orderResponse = await fetch('https://kaplan-mocha.vercel.app//api/orders/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });

        const data = await orderResponse.json();

        if (orderResponse.ok) {
            setTimeout(() => {
                setPaymentLoading(false);
                setIs3DSecureOpen(false);
                setCompletedOrder({ ...data.order, ...orderData }); 
                setCart([]); 
            }, 1000);
        } else {
            alert("Sipariş kaydedilirken bir hata oluştu.");
            setPaymentLoading(false);
        }

    } catch (error) {
        alert("Sunucuyla iletişim kurulamadı.");
        setPaymentLoading(false);
    }
  };

  // STRIPE VEYA QR SİPARİŞİ BAŞARIYLA TAMAMLANDIĞINDA ÇALIŞACAK FONKSİYON
  const handleStripeSuccess = (orderData) => {
    setCompletedOrder(orderData);
    setCart([]);
    setIsCartOpen(false);
    setShowQR(false);
  };

  // YENİ: KULLANICININ SİPARİŞLERİNİ GETİREN FONKSİYON
  // YENİ: KULLANICININ SİPARİŞLERİNİ GETİREN FONKSİYON
  const handleOpenMyOrders = async () => {
    // Hem _id hem de id değerini kontrol et (Backend hangisini yolluyorsa onu yakala)
    const userId = user?._id || user?.id || null; 

    if (!userId) return alert("Siparişlerinizi görmek için giriş yapmış olmalısınız.");
    
    try {
        const res = await fetch(`https://kaplan-mocha.vercel.app//api/orders/my-orders/${userId}`);
        if (res.ok) {
            const data = await res.json();
            setMyOrders(data);
            setIsOrdersOpen(true);
        }
    } catch (error) {
        console.error("Siparişler alınamadı:", error);
    }
  };

  const displayedProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'Tümü' || p.trCategory === selectedCategory;
    const matchSubCategory = subCategoryFilter === '' || p.mockSubCategory === subCategoryFilter;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    let matchStory = true;
    if (activeStory === 'Kargo Bedava') matchStory = p.isFreeShipping;
    if (activeStory === 'Günün Fırsatı') matchStory = p.discountPercentage >= 20;
    if (activeStory === 'Dev İndirimler') matchStory = p.discountPercentage >= 40;
    if (activeStory === 'Çok Satanlar') matchStory = p.isBestSeller;
    return matchCategory && matchSubCategory && matchSearch && matchStory;
  });

  const favoriteProducts = products.filter(p => favorites.includes(p.id));

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#121212', color: '#ff7a00', fontSize: '24px', fontWeight: 'bold' }}>Kaplan Store Yükleniyor... 🐅</div>;

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', width: '100vw' }}>
      
      {/* ÜRÜN DETAY MODALI */}
      {selectedProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }} onClick={() => setSelectedProduct(null)}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', maxWidth: '800px', width: '90%', display: 'flex', gap: '30px', position: 'relative', border: '1px solid #333' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedProduct(null)} style={{ position: 'absolute', top: '15px', right: '20px', background: 'transparent', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer' }}>✖</button>
            <div style={{ flex: '1', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
              <img src={selectedProduct.image} alt={selectedProduct.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: '1.5', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <span style={{ color: '#ff7a00', fontSize: '13px', fontWeight: 'bold' }}>KAPLAN {selectedProduct.trCategory.toUpperCase()} / {selectedProduct.mockSubCategory}</span>
              <h2 style={{ marginTop: '10px', fontSize: '22px' }}>{selectedProduct.title}</h2>
              <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>{selectedProduct.description}</p>
              
              {selectedProduct.discountPercentage > 0 ? (
                <div>
                  <span style={{ textDecoration: 'line-through', color: '#888', fontSize: '18px' }}>{selectedProduct.price.toFixed(2)} $</span>
                  <h3 style={{ fontSize: '32px', color: '#ff7a00', margin: '5px 0 20px 0' }}>{selectedProduct.discountedPrice.toFixed(2)} $ <span style={{fontSize:'16px', color:'#ff0000'}}>(%{selectedProduct.discountPercentage} İndirim)</span></h3>
                </div>
              ) : (
                <h3 style={{ fontSize: '32px', color: '#ff7a00', margin: '0 0 20px 0' }}>{selectedProduct.price.toFixed(2)} $</h3>
              )}
              
              <button onClick={() => { addToCart(selectedProduct, 1); setSelectedProduct(null); }} style={{ backgroundColor: '#ff7a00', color: '#000', border: 'none', padding: '15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Sepete Ekle</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={{ borderBottom: '1px solid #333', backgroundColor: '#000', position: 'sticky', top: 0, zIndex: 100, width: '100%', boxSizing: 'border-box' }}>
        <div style={{ padding: '15px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }} onClick={() => {setSelectedCategory('Tümü'); setSubCategoryFilter(''); setActiveStory('Tümü'); setCompletedOrder(null);}}>
            <TigerLogo />
            <h1 style={{ margin: 0, color: '#fff', fontSize: '26px', fontWeight: '900', letterSpacing: '-1px' }}>KAPLAN<span style={{color: '#ff7a00'}}>STORE</span></h1>
          </div>

          <div style={{ flex: 1, maxWidth: '900px', position: 'relative' }}>
            <input type="text" placeholder="Ürün, kategori veya marka ara..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 20px', borderRadius: '25px', border: '2px solid #333', backgroundColor: '#1a1a1a', color: '#fff', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'flex', gap: '25px', fontSize: '13px', fontWeight: 'bold', whiteSpace: 'nowrap', alignItems: 'center' }}>
            <div style={{ color: '#ccc', marginRight: '10px' }}>Merhaba, <span style={{ color: '#ff7a00' }}>{user?.fullName || 'Kullanıcı'}</span></div>
            <div onClick={onLogout} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#ff4444' }}>🚪 Çıkış Yap</div>
            
            {/* YENİ: SİPARİŞLERİM BUTONU */}
            <div onClick={handleOpenMyOrders} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#ccc' }}>
              📦 Siparişlerim
            </div>
            
            <div onClick={() => setIsFavoritesOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#ccc' }}>
              ❤️ Favorilerim {favorites.length > 0 && <span style={{background: '#ff7a00', color: '#000', padding: '2px 6px', borderRadius: '10px'}}>{favorites.length}</span>}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', color: '#ff7a00', position: 'relative' }} onClick={() => {setIsCartOpen(!isCartOpen); setShowQR(false);}}>
              🛒 Sepetim {totalItems > 0 && <span style={{background: '#ff7a00', color: '#000', padding: '2px 6px', borderRadius: '10px'}}>{totalItems}</span>}
              
              {isCartOpen && (
                <div style={{ position: 'absolute', top: '150%', right: '0', width: '380px', backgroundColor: '#1e1e1e', border: '1px solid #444', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', zIndex: 200, cursor: 'default' }} onClick={e => e.stopPropagation()}>
                  <div style={{ padding: '15px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#151515' }}>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>Sepetim ({totalItems} Ürün)</h3>
                    <button onClick={() => {setIsCartOpen(false); setShowQR(false);}} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✖</button>
                  </div>
                  
                  {cart.length === 0 ? (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#888' }}>Sepetiniz boş.</div>
                  ) : (
                    <>
                      <div style={{ maxHeight: '350px', overflowY: 'auto', padding: '10px' }}>
                        {cart.map(item => (
                          <div key={item.id} style={{ display: 'flex', gap: '10px', padding: '10px', borderBottom: '1px solid #333', alignItems: 'center' }}>
                            <img src={item.image} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                            <div style={{ flex: 1 }}>
                              <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#ccc', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#ff7a00', fontWeight: 'bold' }}>{(item.discountPercentage > 0 ? item.discountedPrice : item.price).toFixed(2)} $</span>
                                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#222', borderRadius: '4px', border: '1px solid #444' }}>
                                  <button onClick={() => updateCartQuantity(item.id, -1)} style={{ background: 'none', border: 'none', color: '#fff', padding: '2px 8px', cursor: 'pointer' }}>-</button>
                                  <span style={{ fontSize: '12px', padding: '0 5px' }}>{item.quantity}</span>
                                  <button onClick={() => updateCartQuantity(item.id, 1)} style={{ background: 'none', border: 'none', color: '#ff7a00', padding: '2px 8px', cursor: 'pointer' }}>+</button>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer' }}>🗑</button>
                          </div>
                        ))}
                      </div>
                      <div style={{ padding: '15px', backgroundColor: '#151515', borderTop: '1px solid #333' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#aaa', fontSize: '13px' }}><span>Ara Toplam:</span><span>{totalOriginalPrice.toFixed(2)} $</span></div>
                        {totalDiscount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ff0000', fontSize: '13px', marginTop: '5px' }}><span>İndirim:</span><span>- {totalDiscount.toFixed(2)} $</span></div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #444', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}><span>Toplam:</span><span style={{ color: '#ff7a00' }}>{totalFinalPrice.toFixed(2)} $</span></div>
                        
                        {/* QR VEYA NORMAL ÖDEME SEÇİM EKRANI */}
                        {!showQR ? (
                          <>
                            <button onClick={handleStartCheckout} style={{ width: '100%', padding: '12px', marginTop: '15px', backgroundColor: '#0BA360', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', transition: '0.2s' }}>Güvenli Ödemeye Geç</button>
                            
                            <div style={{ display: 'flex', alignItems: 'center', margin: '15px 0' }}>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
                                <span style={{ margin: '0 10px', color: '#888', fontSize: '12px', fontWeight: 'bold' }}>VEYA</span>
                                <div style={{ flex: 1, height: '1px', backgroundColor: '#333' }}></div>
                            </div>

                            <button
                                onClick={() => setShowQR(true)}
                                style={{ width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: '#ff7a00', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}
                            >
                                📱 Karekod (QR) ile Hızlı Öde
                            </button>

                            {/* STRIPE APPLE/GOOGLE PAY BUTONU */}
                            <Elements stripe={stripePromise}>
                              <AppleGooglePayButton 
                                totalAmount={totalFinalPrice} 
                                cart={cart} 
                                user={user} 
                                onSuccess={handleStripeSuccess} 
                              />
                            </Elements>
                          </>
                        ) : (
                          <div style={{ backgroundColor: '#fff', borderRadius: '8px', padding: '10px', marginTop: '15px' }}>
                            <button
                                onClick={() => setShowQR(false)}
                                style={{ marginBottom: '10px', color: '#000', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px' }}
                            >
                                ⬅ Kartla Ödemeye Dön
                            </button>
                            {/* QR Kod Bileşeni çağrılıyor */}
                            <div style={{ transform: 'scale(0.85)', transformOrigin: 'top center', marginBottom: '-40px' }}>
                              <QRPayment 
                                totalAmount={totalFinalPrice} 
                                onSuccess={async () => {
                                  // YENİ: QR Ödeme başarılı olunca siparişi veritabanına kaydediyoruz
                                  const orderData = {
                                    userId: user?._id || user?.id || null,
                                    customerName: user?.fullName || 'QR Hızlı Ödeme Müşterisi',
                                    email: user?.email || 'ardakaplan0707070707@gmail.com',
                                    address: 'Dijital Teslimat / QR Ödeme',
                                    city: 'QR',
                                    phone: 'Belirtilmedi',
                                    items: cart,
                                    totalAmount: totalFinalPrice
                                  };
                                  try {
                                    const orderResponse = await fetch('https://kaplan-mocha.vercel.app/api/orders/create', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify(orderData)
                                    });
                                    const data = await orderResponse.json();
                                    handleStripeSuccess({ ...data.order, ...orderData }); // Ekranı yeşile atıp siparişi onayla
                                  } catch(e) {
                                    console.error("QR siparişi sisteme yazılamadı:", e);
                                  }
                                }} 
                              />
                            </div>
                          </div>
                        )}
                        
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KATEGORİ MENÜSÜ & MEGA MENU */}
        <div style={{ padding: '0 40px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', color: '#aaa', fontSize: '14px', fontWeight: 'bold' }}>
            <div onMouseEnter={() => setIsMegaMenuOpen(true)} onMouseLeave={() => setIsMegaMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', backgroundColor: '#ff7a00', color: '#000', padding: '10px 15px', borderRadius: '6px 6px 0 0', marginTop: '5px' }}>
              <span style={{ fontSize: '18px' }}>☰</span> Kategoriler
            </div>
            <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none', flex: 1 }}>
              {categories.map(cat => (
                <div key={cat} onClick={() => { setSelectedCategory(cat); setSubCategoryFilter(''); setActiveStory('Tümü'); setCompletedOrder(null); }} style={{ cursor: 'pointer', color: selectedCategory === cat && subCategoryFilter === '' ? '#ff7a00' : '#aaa', whiteSpace: 'nowrap', transition: '0.2s', padding: '10px 0' }}>{cat}</div>
              ))}
            </div>
          </div>

          {isMegaMenuOpen && (
            <div onMouseEnter={() => setIsMegaMenuOpen(true)} onMouseLeave={() => setIsMegaMenuOpen(false)} style={{ position: 'absolute', top: '100%', left: '40px', right: '40px', backgroundColor: '#fff', borderRadius: '0 8px 8px 8px', boxShadow: '0 15px 40px rgba(0,0,0,0.5)', zIndex: 150, display: 'flex', border: '1px solid #ddd', minHeight: '350px' }}>
              <div style={{ width: '220px', borderRight: '1px solid #eee', backgroundColor: '#fafafa', padding: '10px 0', borderRadius: '0 0 0 8px' }}>
                {Object.keys(megaMenuData).map(cat => (
                  <div key={cat} onMouseEnter={() => setActiveMegaCategory(cat)} style={{ padding: '12px 20px', cursor: 'pointer', backgroundColor: activeMegaCategory === cat ? '#fff' : 'transparent', color: activeMegaCategory === cat ? '#ff7a00' : '#333', fontWeight: activeMegaCategory === cat ? 'bold' : 'normal', borderLeft: activeMegaCategory === cat ? '4px solid #ff7a00' : '4px solid transparent', display: 'flex', justifyContent: 'space-between' }}>
                    {cat} <span style={{ color: '#ccc', fontSize: '12px' }}>{'>'}</span>
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, padding: '30px', display: 'flex', gap: '40px', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: '0 0 8px 0' }}>
                {megaMenuData[activeMegaCategory].map((group, index) => (
                  <div key={index} style={{ minWidth: '150px' }}>
                    <h4 style={{ margin: '0 0 15px 0', color: '#ff7a00', fontSize: '14px', borderBottom: '1px solid #eee', paddingBottom: '8px' }}>{group.title}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {group.items.map(item => (
                        <span key={item} onClick={() => { setSelectedCategory(activeMegaCategory); setSubCategoryFilter(item); setIsMegaMenuOpen(false); setActiveStory('Tümü'); setCompletedOrder(null); }} style={{ color: '#555', fontSize: '13px', cursor: 'pointer' }} onMouseOver={(e) => e.target.style.color = '#ff7a00'} onMouseOut={(e) => e.target.style.color = '#555'}>{item}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: '20px 40px', boxSizing: 'border-box' }}>
        
        {/* SİPARİŞ ALINDI (ORDER RECEIVED) EKRANI */}
        {completedOrder ? (
          <div style={{ maxWidth: '900px', margin: '40px auto', backgroundColor: '#1a1a1a', padding: '40px', borderRadius: '12px', border: '1px solid #333' }}>
            <h1 style={{ color: '#fff', fontSize: '32px', marginTop: 0 }}>Sipariş Alındı (Order Received)</h1>
            <p style={{ color: '#aaa', fontSize: '16px', marginBottom: '30px' }}>Teşekkür ederiz. Siparişiniz başarıyla alınmıştır.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', backgroundColor: '#222', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #444' }}>
              <div>
                <span style={{ color: '#888', fontSize: '12px', display: 'block' }}>SİPARİŞ NUMARASI:</span>
                <strong style={{ color: '#ff7a00', fontSize: '16px' }}>#{completedOrder.transactionId || completedOrder._id?.substring(0,8).toUpperCase() || '19'}</strong>
              </div>
              <div>
                <span style={{ color: '#888', fontSize: '12px', display: 'block' }}>TARİH:</span>
                <strong style={{ color: '#fff', fontSize: '15px' }}>{new Date(completedOrder.createdAt || Date.now()).toLocaleDateString('tr-TR')}</strong>
              </div>
              <div>
                <span style={{ color: '#888', fontSize: '12px', display: 'block' }}>TOPLAM:</span>
                <strong style={{ color: '#0BA360', fontSize: '18px' }}>${completedOrder.totalAmount.toFixed(2)}</strong>
              </div>
              <div>
                <span style={{ color: '#888', fontSize: '12px', display: 'block' }}>ÖDEME YÖNTEMİ:</span>
                <strong style={{ color: '#fff', fontSize: '14px' }}>Karekod (QR) / Dijital Cüzdan</strong>
              </div>
            </div>

            <h3 style={{ color: '#ff7a00', borderBottom: '1px solid #333', paddingBottom: '10px' }}>Sipariş Detayları</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #333', color: '#aaa', textAlign: 'left' }}>
                  <th style={{ padding: '12px 0' }}>Ürün</th>
                  <th style={{ padding: '12px 0', textAlign: 'right' }}>Toplam</th>
                </tr>
              </thead>
              <tbody>
                {completedOrder.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '12px 0', color: '#fff' }}>{item.title} <strong style={{ color: '#ff7a00' }}>× {item.quantity}</strong></td>
                    <td style={{ padding: '12px 0', textAlign: 'right', color: '#fff', fontWeight: 'bold' }}>${((item.discountPercentage > 0 ? item.discountedPrice : item.price) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                <tr style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '12px 0', color: '#aaa' }}>Gönderim:</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#0BA360', fontWeight: 'bold' }}>Ücretsiz Kargo</td>
                </tr>
                <tr>
                  <td style={{ padding: '15px 0', color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>Toplam:</td>
                  <td style={{ padding: '15px 0', textAlign: 'right', color: '#ff7a00', fontSize: '20px', fontWeight: 'bold' }}>${completedOrder.totalAmount.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#ff7a00' }}>Gönderim Adresi</h4>
                <p style={{ margin: 0, color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>
                  {completedOrder.customerName}<br/>
                  {completedOrder.address}<br/>
                  {completedOrder.city} / TÜRKİYE<br/>
                  {completedOrder.phone}
                </p>
              </div>
              <div style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #333' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#ff7a00' }}>Fatura Adresi</h4>
                <p style={{ margin: 0, color: '#ccc', fontSize: '14px', lineHeight: '1.6' }}>
                  {completedOrder.customerName}<br/>
                  {completedOrder.address}<br/>
                  {completedOrder.city} / TÜRKİYE<br/>
                  {completedOrder.phone}
                </p>
              </div>
            </div>

            <button onClick={() => setCompletedOrder(null)} style={{ marginTop: '30px', backgroundColor: '#ff7a00', color: '#000', border: 'none', padding: '15px 30px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Mağazaya Geri Dön</button>
          </div>
        ) : (
          /* NORMAL MAĞAZA VİTRİNİ */
          <>
            <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
              {stories.map(story => (
                <div key={story.id} onClick={() => { setActiveStory(story.title); setSelectedCategory('Tümü'); setSubCategoryFilter(''); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', minWidth: '80px', opacity: activeStory === story.title ? 1 : 0.6, transition: '0.2s' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#1a1a1a', border: activeStory === story.title ? '3px solid #ff7a00' : '2px solid #444', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '35px', boxShadow: activeStory === story.title ? '0 0 15px rgba(255,122,0,0.3)' : 'none' }}>{story.icon}</div>
                  <span style={{ fontSize: '13px', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', color: activeStory === story.title ? '#ff7a00' : '#ccc' }}>{story.title}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', backgroundColor: '#1a1a1a', padding: '20px 25px', borderRadius: '8px', borderLeft: '5px solid #ff7a00' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>{subCategoryFilter !== '' ? <>{selectedCategory} <span style={{color: '#888'}}>{'>'}</span> {subCategoryFilter}</> : activeStory !== 'Tümü' ? `${activeStory} Fırsatları` : (selectedCategory !== 'Tümü' ? `${selectedCategory} Ürünleri` : 'Tüm Ürünler')}</h2>
              <span style={{ color: '#aaa', fontSize: '14px', backgroundColor: '#222', padding: '5px 10px', borderRadius: '4px' }}>{displayedProducts.length} Ürün Listelendi</span>
            </div>

            {displayedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '100px 20px', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px dashed #444' }}>
                <span style={{ fontSize: '50px' }}>🔍</span>
                <h3 style={{ color: '#fff', margin: '20px 0 10px 0', fontSize: '24px' }}>Bu kategoriye ait ürün bulunamadı</h3>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '25px', marginBottom: '40px' }}>
                {displayedProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAddToCart={addToCart} onProductClick={setSelectedProduct} isFavorite={favorites.includes(product.id)} toggleFavorite={toggleFavorite} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* FAVORİLER PENCERESİ */}
      {isFavoritesOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }} onClick={() => setIsFavoritesOpen(false)}>
          <div style={{ backgroundColor: '#1a1a1a', width: '500px', maxHeight: '80vh', borderRadius: '10px', padding: '25px', overflowY: 'auto', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#ff7a00', display: 'flex', alignItems: 'center', gap: '10px' }}>❤️ Favori Ürünlerim</h2>
              <button onClick={() => setIsFavoritesOpen(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer', transition: '0.2s' }}>✖</button>
            </div>
            {favoriteProducts.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>📭</span>
                <p>Henüz favorilere hiçbir ürün eklemedin.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {favoriteProducts.map(favProduct => (
                  <div key={favProduct.id} style={{ display: 'flex', gap: '15px', backgroundColor: '#222', padding: '15px', borderRadius: '8px', alignItems: 'center', border: '1px solid #333' }}>
                    <img src={favProduct.image} alt={favProduct.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', color: '#fff', fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{favProduct.title}</p>
                      <p style={{ margin: 0, color: '#0BA360', fontWeight: 'bold' }}>{(favProduct.discountPercentage > 0 ? favProduct.discountedPrice : favProduct.price).toFixed(2)} $</p>
                    </div>
                    <button onClick={() => toggleFavorite(favProduct.id)} style={{ backgroundColor: '#ff4444', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Kaldır</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* YENİ: SİPARİŞLERİM PENCERESİ */}
      {isOrdersOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }} onClick={() => setIsOrdersOpen(false)}>
          <div style={{ backgroundColor: '#1a1a1a', width: '600px', maxHeight: '80vh', borderRadius: '10px', padding: '25px', overflowY: 'auto', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '15px', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#ff7a00', display: 'flex', alignItems: 'center', gap: '10px' }}>📦 Sipariş Geçmişim</h2>
              <button onClick={() => setIsOrdersOpen(false)} style={{ backgroundColor: 'transparent', border: 'none', color: '#888', fontSize: '24px', cursor: 'pointer', transition: '0.2s' }}>✖</button>
            </div>
            
            {myOrders.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>
                <span style={{ fontSize: '40px', display: 'block', marginBottom: '10px' }}>🛍️</span>
                <p>Henüz hiç sipariş vermemişsiniz.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {myOrders.map(order => (
                  <div key={order._id} style={{ backgroundColor: '#222', padding: '20px', borderRadius: '8px', border: '1px solid #444' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #444', paddingBottom: '10px', marginBottom: '10px' }}>
                      <div>
                        <strong style={{ color: '#ff7a00', fontSize: '16px' }}>#{order.transactionId || order._id.substring(0,8).toUpperCase()}</strong>
                        <span style={{ color: '#888', fontSize: '13px', marginLeft: '10px' }}>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                      </div>
                      <strong style={{ color: '#0BA360', fontSize: '18px' }}>${order.totalAmount?.toFixed(2)}</strong>
                    </div>
                    
                    <div style={{ fontSize: '13px', color: '#ccc', marginBottom: '10px' }}>
                      <strong style={{color: '#fff'}}>Durum:</strong> <span style={{ backgroundColor: 'rgba(11, 163, 96, 0.2)', color: '#0BA360', padding: '2px 8px', borderRadius: '4px', marginLeft: '5px' }}>{order.status}</span>
                    </div>
                    
                    <div style={{ backgroundColor: '#1a1a1a', padding: '10px', borderRadius: '6px' }}>
                      <strong style={{color: '#fff', fontSize: '12px', display: 'block', marginBottom: '5px'}}>Satın Alınan Ürünler:</strong>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#aaa', padding: '3px 0' }}>
                          <span>{item.title} <span style={{color: '#ff7a00'}}>x{item.quantity}</span></span>
                          <span>${((item.discountPercentage > 0 ? item.discountedPrice : item.price) * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADIM 1: TESLİMAT VE İLETİŞİM BİLGİLERİ FORMU */}
      {isAddressFormOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
            <div style={{ backgroundColor: '#1a1a1a', padding: '40px', borderRadius: '12px', width: '500px', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#fff', margin: 0 }}>Teslimat Bilgileri</h2>
                    <h3 style={{ color: '#ff7a00', margin: 0 }}>{totalFinalPrice.toFixed(2)} $</h3>
                </div>
                <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '25px' }}>Güvenli ödeme adımına geçmeden önce lütfen sipariş detaylarınızı eksiksiz doldurun.</p>
                <form onSubmit={handleAddressSubmit}>
                    <input type="text" placeholder="Ad Soyad" required value={customerDetails.name} onChange={(e) => setCustomerDetails({...customerDetails, name: e.target.value})} style={{ width: '100%', padding: '15px', marginBottom: '15px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                        <input type="email" placeholder="E-Posta" required value={customerDetails.email} onChange={(e) => setCustomerDetails({...customerDetails, email: e.target.value})} style={{ flex: 1, padding: '15px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' }} />
                        <input type="tel" placeholder="Telefon (05..)" required value={customerDetails.phone} onChange={(e) => setCustomerDetails({...customerDetails, phone: e.target.value})} style={{ flex: 1, padding: '15px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                      <select required value={customerDetails.city} onChange={(e) => setCustomerDetails({...customerDetails, city: e.target.value})} style={{ flex: 1, padding: '15px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' }}>
                        <option value="İstanbul">İstanbul</option>
                        <option value="Ankara">Ankara</option>
                        <option value="İzmir">İzmir</option>
                        <option value="Antalya">Antalya</option>
                        <option value="Bursa">Bursa</option>
                      </select>
                    </div>
                    <textarea placeholder="Açık Adresiniz (Mahalle, Sokak, No, Daire)" required value={customerDetails.address} onChange={(e) => setCustomerDetails({...customerDetails, address: e.target.value})} rows="3" style={{ width: '100%', padding: '15px', marginBottom: '25px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box', resize: 'none' }}></textarea>
                    
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button type="button" onClick={() => setIsAddressFormOpen(false)} style={{ flex: 1, padding: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Geri Dön</button>
                        <button type="submit" style={{ flex: 2, padding: '15px', backgroundColor: '#ff7a00', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Kart Bilgilerine Geç</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* ADIM 2: GARANTİ BBVA KART BİLGİLERİ GİRİŞİ */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000 }}>
            <div style={{ backgroundColor: '#1a1a1a', padding: '40px', borderRadius: '12px', width: '500px', border: '1px solid #333', boxShadow: '0 20px 50px rgba(0,0,0,0.7)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ color: '#0BA360', margin: 0 }}>Garanti BBVA ile Öde</h2>
                    <h3 style={{ color: '#ff7a00', margin: 0 }}>{totalFinalPrice.toFixed(2)} $</h3>
                </div>
                <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '25px' }}>Garanti BBVA Sanal POS 3D Secure güvenlik sistemine yönlendirileceksiniz.</p>
                <form onSubmit={handleInitiate3DSecure}>
                    <input type="text" placeholder="Kart Üzerindeki İsim" required defaultValue={customerDetails.name} style={{ width: '100%', padding: '15px', marginBottom: '15px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' }} />
                    <input type="text" placeholder="Kart Numarası (16 Hane)" maxLength="16" required defaultValue="4282209004348015" style={{ width: '100%', padding: '15px', marginBottom: '15px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                        <input type="text" placeholder="SKT (AA/YY)" required defaultValue="08/27" style={{ flex: 1, padding: '15px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' }} />
                        <input type="text" placeholder="CVV" maxLength="3" required defaultValue="123" style={{ flex: 1, padding: '15px', backgroundColor: '#222', border: '1px solid #444', color: '#fff', borderRadius: '8px', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button type="button" onClick={() => { setIsCheckoutOpen(false); setIsAddressFormOpen(true); }} style={{ flex: 1, padding: '15px', backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Adrese Dön</button>
                        <button type="submit" style={{ flex: 2, padding: '15px', backgroundColor: '#0BA360', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>3D Secure ile Öde</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* ADIM 3: GARANTİ BBVA 3D SECURE SMS DOĞRULAMA PENCERESİ */}
      {is3DSecureOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20000 }}>
            <div style={{ backgroundColor: '#ffffff', color: '#333', padding: '35px', borderRadius: '12px', width: '450px', border: '3px solid #0BA360', boxShadow: '0 25px 60px rgba(0,0,0,0.8)' }}>
                <div style={{ textAlign: 'center', borderBottom: '2px solid #eee', paddingBottom: '15px', marginBottom: '20px' }}>
                    <h2 style={{ color: '#0BA360', margin: '0 0 5px 0', fontSize: '22px' }}>Garanti BBVA 3D Secure</h2>
                    <span style={{ fontSize: '13px', color: '#666' }}>Güvenli Doğrulama Adımı</span>
                </div>
                
                <p style={{ fontSize: '14px', lineHeight: '1.5', color: '#444' }}>
                  <strong>{customerDetails.name}</strong>, işleminizi onaylamak için <strong>{customerDetails.phone || '0535***1410'}</strong> nolu telefonunuza gönderilen 6 haneli SMS şifresini giriniz.
                </p>

                <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '6px', fontSize: '13px', marginBottom: '20px', border: '1px solid #e9ecef' }}>
                    <div>Isyeri Adı: <strong>KAPLAN STORE A.Ş.</strong></div>
                    <div>İşlem Tutarı: <strong style={{ color: '#0BA360' }}>${totalFinalPrice.toFixed(2)}</strong></div>
                </div>

                <form onSubmit={handleVerify3DSecure}>
                    <input 
                      type="text" 
                      placeholder="SMS Şifresi (Örn: 123456)" 
                      maxLength="6" 
                      required 
                      value={otpCode} 
                      onChange={(e) => setOtpCode(e.target.value)} 
                      style={{ width: '100%', padding: '15px', fontSize: '18px', textAlign: 'center', letterSpacing: '5px', marginBottom: '20px', border: '2px solid #0BA360', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' }} 
                    />
                    
                    <button 
                      type="submit" 
                      disabled={paymentLoading} 
                      style={{ width: '100%', padding: '15px', backgroundColor: '#0BA360', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '16px', cursor: paymentLoading ? 'not-allowed' : 'pointer' }}
                    >
                        {paymentLoading ? 'Bankadan Onay Alınıyor...' : 'Onayla ve Ödemeyi Tamamla'}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}

// ==========================================
// 4. ANA YÖNLENDİRİCİ (APP ROUTER)
// ==========================================
function App() {
  const [currentUserRole, setCurrentUserRole] = useState(null); 
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (storedUser && storedRole) {
      setCurrentUser(JSON.parse(storedUser));
      setCurrentUserRole(storedRole);
    }
    
    setIsAuthLoading(false);
  }, []);

  if (isAuthLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <h2>Oturum kontrol ediliyor...</h2>
      </div>
    );
  }

  const handleLogin = (role, user, jwtToken) => {
    setCurrentUserRole(role);
    setCurrentUser(user);
    setToken(jwtToken);
    
    localStorage.setItem('role', role);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', jwtToken);
  };

  const handleLogout = () => {
    setCurrentUserRole(null);
    setCurrentUser(null);
    setToken(null);
    
    localStorage.removeItem('role'); 
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <Router>
      <style>
        {`
        body, html { margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: 100% !important; overflow-x: hidden; }
        #root { max-width: 100% !important; padding: 0 !important; margin: 0 !important; width: 100% !important; }
        `}
      </style>

      <Routes>
        <Route path="/" element={!currentUserRole ? (<AuthScreen onAuth={handleLogin} />) : currentUserRole === 'admin' ? (<Navigate to="/dashboard" replace />) : (<Navigate to="/magaza" replace />)} />
        <Route path="/dashboard" element={currentUserRole === 'admin' ? (<AdminDashboard onLogout={handleLogout} user={currentUser} />) : (<Navigate to="/" replace />)} />
        <Route path="/admin/hizli-ekle" element={currentUserRole === 'admin' ? (<AdminBarcodeAdd />) : (<Navigate to="/" replace/>)} />
        <Route path="/qr-odeme" element={<QRPayment />} />
        <Route path="/mobile-pay/:sessionId" element={<MobilePay />} />
        <Route path="/magaza" element={currentUserRole === 'user' ? (<StoreFront onLogout={handleLogout} user={currentUser} />) : (<Navigate to="/" replace />)} />
      </Routes>
    </Router>
  );
}

export default App;