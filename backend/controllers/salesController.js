// backend/controllers/salesController.js
const orderService = require('../services/orderService');

// 1. GARANTİ BBVA SANAL POS (Ödeme Başlatma)
exports.garantiPayment = async (req, res) => {
    try {
        // İsteği (req.body) doğrudan Service katmanına işlenmesi için gönderiyoruz
        await orderService.processGarantiPayment(req.body);

        res.status(200).json({ 
            success: true, 
            message: "Ödeme Garanti BBVA üzerinden başarıyla tamamlandı." 
        });
    } catch (error) {
        console.error("Ödeme Hatası:", error);
        res.status(500).json({ 
            success: false, 
            message: "Ödeme işlemi başarısız." 
        });
    }
};

// 2. ADMİN PANELİ İÇİN İSTATİSTİKLER (Bekleyen, Onaylanan, Gelir)
exports.getSalesStats = async (req, res) => {
    try {
        // Tüm istatistik verilerini Service katmanından tek bir fonksiyonla çekiyoruz
        const stats = await orderService.getDashboardStats();

        res.status(200).json({
            success: true,
            stats: stats
        });
    } catch (error) {
        console.error("İstatistik Hatası:", error);
        res.status(500).json({ 
            success: false, 
            message: "İstatistikler çekilemedi." 
        });
    }
};