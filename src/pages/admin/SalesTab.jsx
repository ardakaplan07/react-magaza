import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SalesTab = () => {
    const [stats, setStats] = useState({ pendingCount: 0, approvedCount: 0, totalRevenue: 0 });
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSalesData = async () => {
            try {
                // Kendi API yoluna göre düzenle
                const response = await axios.get('/api/admin/sales-stats'); 
                if (response.data.success) {
                    setStats(response.data.stats);
                    setOrders(response.data.recentOrders);
                }
                setLoading(false);
            } catch (error) {
                console.error("Satış verileri çekilemedi:", error);
                setLoading(false);
            }
        };
        fetchSalesData();
    }, []);

    if (loading) return <div className="text-center p-10">Satış verileri yükleniyor...</div>;

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Satışlar ve Gelir Yönetimi</h2>

            {/* İstatistik Kartları */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-400">
                    <h3 className="text-gray-500 text-sm font-semibold">BEKLENEN SATIŞLAR</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.pendingCount} Adet</p>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
                    <h3 className="text-gray-500 text-sm font-semibold">ONAYLANMIŞ SATIŞLAR</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stats.approvedCount} Adet</p>
                </div>

                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-lg shadow text-white">
                    <h3 className="text-blue-100 text-sm font-semibold">TOPLAM ELDE EDİLEN GELİR</h3>
                    <p className="text-3xl font-bold mt-2">
                        {new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(stats.totalRevenue)}
                    </p>
                </div>
            </div>

            {/* Son Siparişler Tablosu */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b">
                    <h3 className="text-lg font-bold text-gray-700">Son İşlemler</h3>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600">
                        <tr>
                            <th className="p-4">Müşteri</th>
                            <th className="p-4">Tarih</th>
                            <th className="p-4">Ödeme Yöntemi</th>
                            <th className="p-4">Tutar</th>
                            <th className="p-4">Durum</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order._id} className="border-b hover:bg-gray-50">
                                <td className="p-4">{order.customerName}</td>
                                <td className="p-4">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                                <td className="p-4 text-sm text-gray-500">{order.paymentMethod}</td>
                                <td className="p-4 font-semibold">{order.totalAmount} TL</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                        order.status === 'Onaylandı' ? 'bg-green-100 text-green-700' :
                                        order.status === 'Bekliyor' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <p className="p-6 text-center text-gray-500">Henüz hiç sipariş bulunmuyor.</p>
                )}
            </div>
        </div>
    );
};

export default SalesTab;