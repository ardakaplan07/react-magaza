const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const twilio = require('twilio');
const barcodeRoutes = require('./routes/barcodeRoutes');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// MongoDB Bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🐅 Kaplan Store: MongoDB Bağlantısı Başarılı!'))
  .catch((err) => console.log('MongoDB Bağlantı Hatası:', err));

// --- SİPARİŞ (ORDER) MODELİ ---
const OrderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },    
    address: { type: String },  
    city: { type: String },     
    items: { type: Array, required: true },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, default: 'Kredi/Banka Kartı (Garanti BBVA 3D Secure)' },
    status: { type: String, default: 'Sipariş Onaylandı (Ödendi)' },
    transactionId: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/products', require('./routes/products'));
app.use('/api/barcode', barcodeRoutes);

const nodemailer = require('nodemailer');

// ==========================================
// E-POSTA İLE DOĞRULAMA & FATURA (NODEMAILER ALTYAPISI)
// ==========================================

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'ardakaplan0707070707@gmail.com',
        pass: process.env.EMAIL_PASS
    }
});

const otpStore = new Map();

// 1. 3D Secure SMS Kodu Gönderme
app.post('/api/payment/send-sms', async (req, res) => {
    const { phone, customerName, totalAmount, email } = req.body; 
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    
    otpStore.set(phone, generatedOtp);
    setTimeout(() => otpStore.delete(phone), 3 * 60 * 1000); 

    try {
        const mailOptions = {
            from: '"Kaplan Store Güvenlik" <ardakaplan0707070707@gmail.com>',
            to: email || 'ardakaplan0707070707@gmail.com',
            subject: 'Kaplan Store - 3D Secure Onay Kodunuz',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
                    <h2>🐅 Kaplan Store'a Hoş Geldiniz!</h2>
                    <p>Sayın <b>${customerName || 'Müşterimiz'}</b>, işleminizi tamamlamak için güvenli doğrulama kodunuz aşağıdadır:</p>
                    <h1 style="color: #4CAF50; letter-spacing: 5px;">${generatedOtp}</h1>
                    <p>İşlem Tutarı: <b>$${totalAmount}</b></p>
                    <p><em>Bu kod 3 dakika boyunca geçerlidir. Lütfen kimseyle paylaşmayınız.</em></p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`✅ E-POSTA GÖNDERİLDİ! Kod: ${generatedOtp}`);
        res.json({ success: true, message: "Doğrulama kodu e-posta adresinize gönderildi!" });
    } catch (error) {
        console.log(`⚠️ HATA! Test Kodu: ${generatedOtp}`);
        res.json({ success: true, message: "Terminaldeki kodu kullanın." });
    }
});

// Stripe kütüphanesini çağırıyoruz
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body; 
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, 
      currency: 'try', 
      payment_method_types: ['card'], 
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/payment/verify-sms', (req, res) => {
    const { phone, otpCode } = req.body; 
    if (!otpCode) return res.status(400).json({ success: false, message: "Doğrulama kodu backend'e eksik ulaştı!" });

    const storedOtp = otpStore.get(phone);
    if (!storedOtp) return res.status(400).json({ success: false, message: "Kodun süresi dolmuş veya geçersiz işlem." });

    if (storedOtp === otpCode.toString()) {
        otpStore.delete(phone); 
        return res.json({ success: true, message: "3D Doğrulama başarılı! Sipariş oluşturuluyor..." });
    } else {
        return res.status(400).json({ success: false, message: "Hatalı kod girdiniz. Lütfen tekrar deneyin." });
    }
});


// 3. SİPARİŞİ KAYDET VE GERÇEK MAİL GÖNDER!
app.post('/api/orders/create', async (req, res) => {
    try {
        const { userId, customerName, email, phone, address, city, items, totalAmount } = req.body;
        const transactionId = 'KPLN_' + Math.floor(10000000 + Math.random() * 90000000);

        const newOrder = new Order({
            userId: userId || null,
            customerName: customerName,
            email: email,
            phone: phone,
            address: address,
            city: city,
            items,
            totalAmount,
            status: 'Hazırlanıyor (Ödendi)',
            transactionId
        });

        await newOrder.save();

        // 🎉 İŞTE BURADA MÜŞTERİYE GERÇEK FATURA MAİLİ GİDİYOR
        if (email) {
            const mailOptions = {
                from: '"Kaplan Store Sipariş" <ardakaplan0707070707@gmail.com>',
                to: email, // Formdan gelen gerçek mail
                subject: `Siparişiniz Alındı! #${transactionId}`,
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; border: 1px solid #ddd; border-radius: 12px; max-width: 600px; margin: 0 auto; background-color: #fafafa;">
                        <h2 style="color: #ff7a00; text-align: center; border-bottom: 2px solid #ff7a00; padding-bottom: 15px;">🐅 Kaplan Store</h2>
                        <h3 style="color: #333;">Merhaba ${customerName},</h3>
                        <p style="color: #555; line-height: 1.6;">Siparişiniz başarıyla alınmış olup, hazırlık aşamasına geçilmiştir. Bizi tercih ettiğiniz için teşekkür ederiz!</p>
                        
                        <div style="background-color: #fff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #eee;">
                            <h4 style="margin-top: 0; color: #888;">SİPARİŞ DETAYLARI (#${transactionId})</h4>
                            <ul style="list-style: none; padding: 0; margin: 0;">
                                ${items.map(item => `
                                    <li style="padding: 10px 0; border-bottom: 1px dashed #eee; display: flex; justify-content: space-between;">
                                        <span style="color: #333;">${item.title} <b style="color: #ff7a00;">(x${item.quantity})</b></span>
                                        <strong style="color: #0BA360;">$${((item.discountPercentage > 0 ? item.discountedPrice : item.price) * item.quantity).toFixed(2)}</strong>
                                    </li>
                                `).join('')}
                            </ul>
                            <h3 style="text-align: right; color: #333; margin-top: 15px;">Toplam: <span style="color: #ff7a00;">$${totalAmount.toFixed(2)}</span></h3>
                        </div>
                        
                        <div style="background-color: #f1f1f1; padding: 15px; border-radius: 6px;">
                            <strong style="color: #555; display: block; margin-bottom: 5px;">Teslimat Adresi:</strong>
                            <p style="margin: 0; color: #666; font-size: 14px;">${address}, ${city} <br/> Tel: ${phone}</p>
                        </div>
                        
                        <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">Bu e-posta otomatik olarak gönderilmiştir.</p>
                    </div>
                `
            };
            transporter.sendMail(mailOptions).catch(err => console.log("Fatura maili atılamadı:", err));
        }

        res.status(201).json({ message: 'Ödeme Başarılı!', order: newOrder });
    } catch (error) {
        res.status(500).json({ message: 'Sipariş işlenemedi', error });
    }
});

// ADMIN: Tüm Siparişleri Getir
app.get('/api/admin/orders', async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Siparişler getirilemedi', error });
    }
});

// YENİ: KULLANICIYA ÖZEL SİPARİŞLERİ GETİR (Siparişlerim Sayfası İçin)
app.get('/api/orders/my-orders/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Siparişler getirilemedi', error });
    }
});

// ==========================================
// QR KOD ÖDEME SİSTEMİ API'LERİ
// ==========================================
const qrSessions = {}; 

app.post('/api/qr/create-session', (req, res) => {
    const { amount } = req.body;
    const sessionId = Math.random().toString(36).substring(2, 10); 
    qrSessions[sessionId] = { status: 'pending', amount: amount };
    const qrUrl = `http://localhost:5173/mobile-pay/${sessionId}`;
    res.json({ sessionId, qrUrl });
});

app.get('/api/qr/status/:sessionId', (req, res) => {
    const session = qrSessions[req.params.sessionId];
    if(!session) return res.status(404).json({ error: 'Oturum bulunamadı' });
    res.json({ status: session.status });
});

app.post('/api/qr/pay/:sessionId', (req, res) => {
    const session = qrSessions[req.params.sessionId];
    if(session) {
        session.status = 'paid'; 
        res.json({ success: true, message: 'Ödeme başarıyla alındı!' });
    } else {
        res.status(404).json({ success: false, message: 'Geçersiz QR Oturumu' });
    }
});

// ==========================================
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`🚀 Sunucu ${PORT} portunda kükrüyor!`));
}
// Vercel'in bizim uygulamamızı tanıması için dışarı aktarıyoruz:
module.exports = app;