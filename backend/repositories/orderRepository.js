// backend/repositories/orderRepository.js
const Order = require('../models/Order');

// A. Sipariş Oluşturma (21-29. satırlardan taşınan kısım)
const createOrder = async (orderData) => {
    const newOrder = new Order(orderData);
    return await newOrder.save();
};

// B. Bekleyen Sipariş Sayısını Alma (42. satırdan taşınan kısım)
const getPendingCount = async () => {
    return await Order.countDocuments({ status: 'Bekliyor' });
};

// C. Onaylanan Sipariş Sayısını Alma (45. satırdan taşınan kısım)
const getApprovedCount = async () => {
    return await Order.countDocuments({ status: 'Onaylandı' });
};

// D. Toplam Geliri Hesaplama (48-52. satırlardan taşınan kısım)
const getTotalRevenue = async () => {
    const revenueData = await Order.aggregate([
        { $match: { status: 'Onaylandı' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    return revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
};

// E. Son Siparişleri Listeleme (57. satırdan taşınan kısım)
const getRecentOrders = async (limit = 10) => {
    return await Order.find().sort({ createdAt: -1 }).limit(limit);
};

module.exports = {
    createOrder,
    getPendingCount,
    getApprovedCount,
    getTotalRevenue,
    getRecentOrders
};