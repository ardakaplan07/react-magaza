import { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // QR üreten kütüphane

const QRPayment = ({ totalAmount, onSuccess }) => {
    const [sessionId, setSessionId] = useState(null);
    const [qrUrl, setQrUrl] = useState('');
    const [status, setStatus] = useState('pending'); // 'pending' veya 'paid'

    // 1. Ekran ilk açıldığında Backend'den benzersiz Ödeme ID'si iste
    useEffect(() => {
        fetch('https://kaplan-mocha.vercel.app/api/qr/create-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: totalAmount })
        })
        .then(res => res.json())
        .then(data => {
            setSessionId(data.sessionId);
            setQrUrl(data.qrUrl); // QR kodun içine gizlenecek link
        })
        .catch(err => console.error("QR Oturumu oluşturulamadı", err));
    }, [totalAmount]);

    // 2. Her 3 saniyede bir Backend'e "Ödeme yapıldı mı?" diye sor (Polling)
    useEffect(() => {
        // Eğer session yoksa veya zaten ödendiyse sormayı bırak
        if (!sessionId || status === 'paid') return;

        const interval = setInterval(() => {
            fetch(`https://kaplan-mocha.vercel.app/api/qr/status/${sessionId}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'paid') {
                    setStatus('paid'); // Ekranı yeşil yap
                    clearInterval(interval); // Soru sormayı durdur
                    
                    // 2 saniye sonra ana ekrandaki siparişi tamamlama fonksiyonunu tetikle
                    setTimeout(() => {
                        onSuccess(); 
                    }, 2000);
                }
            });
        }, 3000); // 3000 ms = 3 saniye

        // Bileşen ekrandan kalkarsa sayacı temizle
        return () => clearInterval(interval);
    }, [sessionId, status, onSuccess]);

    // TEST BUTONU FONKSİYONU: Telefondan okutmakla uğraşmadan direkt ödeme yapmak için
    const simulateMobilePayment = () => {
        fetch(`https://kaplan-mocha.vercel.app/api/qr/pay/${sessionId}`, { method: 'POST' });
    };

    return (
        <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#fff', borderRadius: '10px' }}>
            {status === 'paid' ? (
                <div style={{ padding: '30px 10px', color: '#0BA360' }}>
                    <h2 style={{ margin: 0, fontSize: '24px' }}>✅ Ödeme Başarılı!</h2>
                    <p style={{ color: '#666', fontSize: '14px' }}>Siparişiniz hazırlanıyor...</p>
                </div>
            ) : (
                <>
                    {qrUrl ? (
                        <div style={{ border: '2px dashed #ccc', padding: '15px', display: 'inline-block', borderRadius: '10px', backgroundColor: '#fff' }}>
                            <QRCodeCanvas value={qrUrl} size={180} />
                        </div>
                    ) : (
                        <p style={{ color: '#000', padding: '50px 0' }}>QR Kod Yükleniyor...</p>
                    )}
                    <p style={{ fontSize: '13px', color: '#888', marginTop: '15px', lineHeight: '1.4' }}>
                        Lütfen banka uygulamanızdan <br/> QR kodu okutunuz.
                    </p>
                    
                    {/* Test edebilmen için sahte ödeme butonu */}
                    <button 
                        onClick={simulateMobilePayment} 
                        style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#4287f5', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        (Test) Telefondan Ödendi Say
                    </button>
                </>
            )}
        </div>
    );
}

export default QRPayment;