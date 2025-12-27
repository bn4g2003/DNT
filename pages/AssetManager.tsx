import React, { useState, useEffect } from 'react';
import { Asset } from '../types';
import { financialService } from '../src/services/financialService';
import { Plus, Trash, History, Download } from 'lucide-react';
import { formatCurrency } from '../src/utils/currencyUtils';
import { exportToExcel } from '../src/utils/excel';

export const AssetManager: React.FC = () => {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Asset>>({
        name: '',
        category: 'Chi phí tài sản hữu hình',
        cost: 0,
        usefulLife: 12,
        purchaseDate: new Date().toISOString().split('T')[0],
        // New fields defaults
        startDate: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        const data = await financialService.getAssets();
        setAssets(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.cost) return;

        // Ensure we handle the extended fields
        await financialService.addAsset({
            ...formData,
            // Calculate end date based on usefulLife if needed, but for now just saving metadata
            // monthlyDepreciation is calculated in service
        } as any);

        setIsModalOpen(false);
        fetchAssets();
    };

    const handleRunDepreciation = async () => {
        if (window.confirm('Chạy tính khấu hao cho tháng này?')) {
            const now = new Date();
            await financialService.runMonthlyDepreciation(now.getMonth() + 1, now.getFullYear());
            alert('Đã tính khấu hao thành công!');
            fetchAssets();
        }
    };

    const handleExport = () => {
        const data = assets.map(a => ({
            'Mã TS': a.code || a.id.slice(0, 6),
            'Tên tài sản': a.name,
            'Danh mục': a.category,
            'Ngày mua': a.purchaseDate,
            'Ngày bắt đầu KH': (a as any).startDate || a.purchaseDate, // Fallback
            'Chi phí trả trước': a.cost,
            'Thời gian phân bổ (tháng)': a.usefulLife,
            'Khấu hao tháng': a.monthlyDepreciation,
            'Giá trị còn lại': a.residualValue,
            'Trạng thái': a.status
        }));
        exportToExcel(data, 'Danh_sach_tai_san', 'Tai_san');
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý Tài sản & Khấu hao</h1>
                    <p className="text-gray-500 text-sm">Theo dõi tài sản, chi phí trả trước và phân bổ chi phí</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExport} className="bg-green-50 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-100">
                        <Download size={20} /> Xuất Excel
                    </button>
                    <button onClick={handleRunDepreciation} className="bg-orange-50 text-orange-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-orange-100">
                        <History size={20} /> Tính Khấu Hao Tháng
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-indigo-700">
                        <Plus size={20} /> Thêm Tài sản
                    </button>
                </div>
            </div>

            <table className="min-w-full bg-white shadow-sm border border-gray-100 rounded-xl overflow-hidden">
                <thead className="bg-gray-50 text-gray-500 text-sm">
                    <tr>
                        <th className="p-4 text-left font-medium">Tên tài sản</th>
                        <th className="p-4 text-left font-medium">Danh mục</th>
                        <th className="p-4 text-left font-medium">Ngày bắt đầu</th>
                        <th className="p-4 text-right font-medium">Chi phí trả trước</th>
                        <th className="p-4 text-right font-medium">Phân bổ tháng</th>
                        <th className="p-4 text-right font-medium">Giá trị còn lại</th>
                        <th className="p-4 text-center font-medium">Thời gian</th>
                        <th className="p-4 text-center font-medium">Trạng thái</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {assets.length > 0 ? (
                        assets.map(asset => (
                            <tr key={asset.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-900">{asset.name}</td>
                                <td className="p-4 text-sm text-gray-500">{asset.category}</td>
                                <td className="p-4 text-sm text-gray-500">{(asset as any).startDate || asset.purchaseDate}</td>
                                <td className="p-4 text-right text-sm font-medium">{formatCurrency(asset.cost)}</td>
                                <td className="p-4 text-right text-sm text-orange-600">{formatCurrency(asset.monthlyDepreciation)}</td>
                                <td className="p-4 text-right text-sm font-bold text-gray-700">{formatCurrency(asset.residualValue)}</td>
                                <td className="p-4 text-center text-sm">{asset.usefulLife} tháng</td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${asset.status === 'Đang khấu hao' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {asset.status}
                                    </span>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={8} className="p-8 text-center text-gray-500">
                                Chưa có tài sản nào. Nhấn "Thêm Tài sản" để bắt đầu.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-bold mb-4">Thêm Tài sản / Chi phí trả trước</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài sản</label>
                                <input
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="Ví dụ: Laptop Dell, Phần mềm quản lý..."
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                                <select
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value as any })}
                                >
                                    <option>Chi phí tài sản hữu hình</option>
                                    <option>Phần mềm cho công tác giảng dạy</option>
                                    <option>Chi phí phần mềm</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày mua</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={formData.purchaseDate}
                                        onChange={e => setFormData({ ...formData, purchaseDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu KH</label>
                                    <input
                                        type="date"
                                        className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={(formData as any).startDate} // Use extended field
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value } as any)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Chi phí trả trước (Nguyên giá)</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                    placeholder="VNĐ"
                                    value={formData.cost || ''}
                                    onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian phân bổ (Tháng)</label>
                                <input
                                    type="number"
                                    className="w-full border p-2 rounded focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={formData.usefulLife || ''}
                                    onChange={e => setFormData({ ...formData, usefulLife: Number(e.target.value) })}
                                    required
                                    min="1"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Khấu hao dự kiến: {formatCurrency(Math.round((formData.cost || 0) / (formData.usefulLife || 1)))} / tháng
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors">Hủy</button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">Lưu Tài sản</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
