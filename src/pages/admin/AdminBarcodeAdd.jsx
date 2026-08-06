import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Html5Qrcode } from 'html5-qrcode';

const AdminBarcodeAdd = () => {
  const [barcode, setBarcode] = useState('');
  const [productData, setProductData] = useState({
    name: '', image: '', price: '', stock: '', description: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Kamera State'leri
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const scannerRef = useRef(null);

  // Sayfa kapanırsa veya başka sekmeye geçilirse kamerayı güvenli kapat
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Ortak Arama Fonksiyonu (Hem klavye Enter, hem de Kamera için)
  const fetchProductFromApi = async (codeToSearch) => {
    setLoading(true);
    setMessage({ text: 'Ürün veritabanında aranıyor...', type: 'warning' });

    try {
      const { data } = await axios.get(`http://localhost:5000/api/barcode/lookup/${codeToSearch}`);
      
      if (data.success) {
        setProductData(prev => ({
          ...prev,
          name: `${data.brand} ${data.name}`.trim(), 
          image: data.image
        }));
        setMessage({ text: 'Ürün bulundu! Lütfen fiyat ve stok girin.', type: 'success' });
      }
    } catch (error) {
      setMessage({ text: 'Ürün bulunamadı. Lütfen tüm bilgileri manuel girin.', type: 'error' });
    }
    setLoading(false);
  };

  // Elle girip Enter'a basıldığında
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (barcode) fetchProductFromApi(barcode);
    }
  };

  // KAMERAYI BAŞLATMA
  const startCamera = () => {
    setIsCameraOpen(true);
    setMessage({ text: 'Kamera açılıyor, lütfen barkodu/QR kodu ekrana gösterin...', type: 'warning' });

    setTimeout(() => {
      const scanner = new Html5Qrcode("barcode-reader");
      scannerRef.current = scanner;

      // YENİ HALİ:
    scanner.start(
    { facingMode: "environment" },
    { fps: 20, disableFlip: false }, // qrbox sınırını kaldırdık, artık tüm kamerayı tarayacak
        (decodedText) => {
          // KOD BAŞARIYLA OKUNDUĞUNDA ÇALIŞACAK KISIM
          setBarcode(decodedText);
          stopCamera(); // Kamerayı kapat
          fetchProductFromApi(decodedText); // API'de aramayı başlat
        },
        (errorMessage) => {
          // Okunmayan kareler için hata atar, burayı boş bırakıyoruz ki konsol dolmasın
        }
      ).catch(err => {
        console.error(err);
        setMessage({ text: 'Kamera açılamadı! Tarayıcının kamera izni verdiğinden emin olun.', type: 'error' });
        setIsCameraOpen(false);
      });
    }, 300);
  };

  // KAMERAYI KAPATMA
  const stopCamera = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        setIsCameraOpen(false);
      }).catch(console.error);
    } else {
      setIsCameraOpen(false);
    }
  };

  // GERÇEK MAĞAZAYA KAYDETME FONKSİYONU
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const newProduct = {
        title: productData.name,
        category: 'Diğer',
        subCategory: 'Genel',
        image: productData.image,
        price: Number(productData.price),
        stock: Number(productData.stock),
        description: productData.description || 'Barkod/QR ile eklendi.',
        isFreeShipping: false,
        isBestSeller: false,
        isDealOfTheDay: false
      };

      const response = await axios.post('http://localhost:5000/api/admin/add-product', newProduct);
      
      if (response.status === 200 || response.status === 201) {
        alert("Ürün başarıyla Kaplan Store'a eklendi! 🚀");
        setBarcode('');
        setProductData({ name: '', image: '', price: '', stock: '', description: '' });
        setMessage({ text: '', type: '' });
      }
    } catch (err) {
      console.error(err);
      alert("Ürün kaydedilirken hata oluştu.");
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto', color: '#fff', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
      
      {/* 1. KISIM: BARKOD GİRİŞİ VE KAMERA */}
      <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontSize: '16px' }}>
          QR / Barkod Cihazı İle Okutun, Elle Girin veya <strong style={{color: '#0BA360'}}>Kamerayı Kullanın</strong>:
        </label>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Barkod bekleniyor..."
            style={{ 
              flex: 1, padding: '12px', fontSize: '18px', 
              borderRadius: '4px', border: '2px solid #ff9900', 
              backgroundColor: '#fff', color: '#000', outline: 'none' 
            }}
          />
          {!isCameraOpen ? (
            <button type="button" onClick={startCamera} style={{ padding: '0 20px', backgroundColor: '#0BA360', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              📷 Kamerayı Aç
            </button>
          ) : (
            <button type="button" onClick={stopCamera} style={{ padding: '0 20px', backgroundColor: '#ff4444', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}>
              Kapat
            </button>
          )}
        </div>

        {/* KAMERA GÖRÜNTÜSÜNÜN ÇIKACAĞI KUTU */}
        <div 
          id="barcode-reader" 
          style={{ 
            width: '100%', 
            marginTop: isCameraOpen ? '20px' : '0', 
            display: isCameraOpen ? 'block' : 'none',
            borderRadius: '8px', overflow: 'hidden', border: '2px dashed #0BA360'
          }}
        ></div>

        {message.text && (
          <p style={{ 
            marginTop: '15px', padding: '10px', borderRadius: '4px',
            backgroundColor: message.type === 'error' ? '#5a1a1a' : message.type === 'success' ? '#1a5a2a' : '#5a5a1a',
            color: '#fff'
          }}>
            {message.text}
          </p>
        )}
      </div>

      {/* 2. KISIM: ÜRÜN DETAYLARI FORMU */}
      <form onSubmit={handleSaveProduct} style={{ backgroundColor: '#2a2a2a', padding: '20px', borderRadius: '8px' }}>
        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
          
          <div style={{ width: '120px', height: '120px', backgroundColor: '#333', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {productData.image ? (
              <img src={productData.image} alt="Ürün" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '12px', color: '#888' }}>Görsel Yok</span>
            )}
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Görsel URL (Manuel Ekleme İçin):</label>
              <input 
                type="text" 
                value={productData.image} 
                onChange={(e) => setProductData({...productData, image: e.target.value})}
                placeholder="https://ornek-resim-linki.com/resim.jpg"
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Ürün Adı:</label>
              <input 
                type="text" 
                value={productData.name} 
                onChange={(e) => setProductData({...productData, name: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                required
              />
            </div>
            
            <div style={{ display: 'flex', gap: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Fiyat ($):</label>
                <input 
                  type="number" 
                  value={productData.price} 
                  onChange={(e) => setProductData({...productData, price: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Stok Adedi:</label>
                <input 
                  type="number" 
                  value={productData.stock} 
                  onChange={(e) => setProductData({...productData, stock: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #444', backgroundColor: '#333', color: '#fff' }}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" style={{ 
          width: '100%', padding: '15px', 
          backgroundColor: '#ff9900', color: '#111', 
          fontSize: '18px', fontWeight: 'bold', 
          border: 'none', borderRadius: '4px', cursor: 'pointer' 
        }}>
          Ürünü Mağazaya Ekle
        </button>
      </form>
    </div>
  );
};

export default AdminBarcodeAdd;