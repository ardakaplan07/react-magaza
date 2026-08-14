// backend/services/orderService.js
const orderRepository = require('../repositories/orderRepository');
const crypto = require('crypto'); // Garanti Hash işlemleri için buraya taşıdık

// 1. Ödeme İşlemleri ve Sipariş Oluşturma Mantığı
const processGarantiPayment = async (paymentData) => {
    const { amount, cardNumber, expiry, cvv, orderId, customerName, customerEmail } = paymentData;

    // DİKKAT: Garanti'den aldığın gerçek bilgiler
    const merchantId = "1234567";
    const terminalId = "12345678";
    const storeKey = "SENIN_STORE_KEY_SIFREN";

    // 3D Secure Hash Oluşturma Mantığı
    const hashString = `${terminalId}${orderId}${amount}00${storeKey}`;
    const hash = crypto.createHash('sha1').update(hashString).digest('base64');

    // Burada Garanti API'sine istek atıldığını varsayıyoruz...

    // Sipariş verisini hazırlayıp Repository'ye (Veritabanına) gönderiyoruz
    const orderData = {
        customerName: customerName || "Misafir Müşteri",
        customerEmail: customerEmail || "ornek@mail.com",
        totalAmount: amount,
        status: 'Onaylandı',
        transactionId: "GRNT" + Math.floor(Math.random() * 100000000)
    };

    return await orderRepository.createOrder(orderData);
};

// 2. İstatistikleri Toplama Mantığı
const getDashboardStats = async () => {
    // Repository'den veritabanı sorgularının sonuçlarını alıyoruz
    const pendingCount = await orderRepository.getPendingCount();
    const approvedCount = await orderRepository.getApprovedCount();
    const totalRevenue = await orderRepository.getTotalRevenue();
    const recentOrders = await orderRepository.getRecentOrders();

    // Controller'a gitmek üzere hepsini tek bir objede paketliyoruz
    return {
        pendingCount,
        approvedCount,
        totalRevenue,
        recentOrders
    };
};

module.exports = {
    processGarantiPayment,
    getDashboardStats
};