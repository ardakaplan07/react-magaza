import { useState } from 'react';
import { useParams } from 'react-router-dom';

const MobilePay = () => {
  const { sessionId } = useParams();
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleConfirm = async () => {
    setStatus('loading');
    try {
      // DİKKAT: Eğer bunu GERÇEK TELEFONDAN okutup deneyecekseniz,
      // "localhost" yazan yeri bilgisayarınızın yerel IP adresiyle değiştirmelisiniz (Örn: 192.168.1.50)
      const response = await fetch(`https://kaplan-mocha.vercel.app//api/qr/pay/${sessionId}`, {
        method: 'POST'
      });
      
      const data = await response.json();
      if (data.success) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error("Ödeme hatası:", error);
      setStatus('error');
    }
  };

  return (
    <div style={{ backgroundColor: '#121212', color: '#fff', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: '#ff7a00', marginBottom: '5px' }}>KAPLAN STORE</h1>
      <h2 style={{ margin: '0 0 30px 0', color: '#ccc', fontSize: '18px' }}>Mobil Hızlı Ödeme Onayı</h2>
      
      <div style={{ backgroundColor: '#1a1a1a', padding: '30px', borderRadius: '12px', border: '1px solid #333', width: '100%', maxWidth: '350px' }}>
        <p style={{ color: '#888', fontSize: '12px', marginBottom: '20px' }}>İşlem ID: {sessionId}</p>
        
        {status === 'idle' && (
          <>
            <p style={{ fontSize: '16px', marginBottom: '30px' }}>Alışverişinizi onaylamak için aşağıdaki butona tıklayın.</p>
            <button onClick={handleConfirm} style={{ width: '100%', padding: '15px', backgroundColor: '#0BA360', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}>
              Ödemeyi Onayla (Simüle Et)
            </button>
          </>
        )}

        {status === 'loading' && <p style={{ fontSize: '18px', color: '#ff7a00' }}>Bankayla İletişim Kuruluyor...</p>}
        
        {status === 'success' && (
          <div>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>✅</div>
            <h3 style={{ color: '#0BA360', margin: '0 0 10px 0' }}>Ödeme Başarılı!</h3>
            <p style={{ color: '#ccc', fontSize: '14px' }}>Bilgisayar ekranınıza geri dönebilirsiniz, siparişiniz tamamlandı.</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{ fontSize: '50px', marginBottom: '10px' }}>❌</div>
            <h3 style={{ color: '#ff4444', margin: '0 0 10px 0' }}>İşlem Başarısız</h3>
            <p style={{ color: '#ccc', fontSize: '14px' }}>Bağlantı kurulamadı. Sunucunuzun açık olduğundan emin olun.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobilePay;