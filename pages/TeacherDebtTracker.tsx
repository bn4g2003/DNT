import React, { useState, useEffect } from 'react';
import { TeacherDebtRecord } from '../types';
import { financialService } from '../src/services/financialService';
import { formatCurrency } from '../src/utils/currencyUtils';
import { Search, Download } from 'lucide-react';
import { exportToExcel } from '../src/utils/excel';

export const TeacherDebtTracker: React.FC = () => {
    const [debts, setDebts] = useState<TeacherDebtRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchDebts();
    }, []);

    const fetchDebts = async () => {
        const data = await financialService.getTeacherDebts();
        setDebts(data);
    };

    const handleExport = () => {
        const data = debts.map(d => ({
            'Giáo viên': d.teacherName,
            'Tháng/Năm': `${d.month}/${d.year}`,
            'Lớp': d.className,
            'Số buổi': d.totalSessions,
            'Tổng lương (Dự kiến)': d.totalSalary,
            'Đã trả': d.paidAmount,
            'Còn nợ': d.remainingDebt,
            'Trạng thái': d.status
        }));
        exportToExcel(data, 'Cong_no_giao_vien', 'Cong_no');
    };

    const filteredDebts = debts.filter(d =>
        d.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.className && d.className.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Theo dõi công nợ Giáo viên</h1>
                    <p className="text-gray-500 text-sm">Quản lý lương và công nợ dựa trên số buổi dạy</p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                    <Download size={18} />
                    Xuất Excel
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex gap-4 bg-gray-50">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border w-full max-w-sm">
                        <Search size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm giáo viên hoặc lớp..."
                            className="outline-none text-sm w-full"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="min-w-full">
                    <thead className="bg-gray-50 text-gray-500 text-sm">
                        <tr>
                            <th className="p-4 text-left font-medium">Giáo viên</th>
                            <th className="p-4 text-left font-medium">Tháng/Năm</th>
                            <th className="p-4 text-left font-medium">Lớp</th>
                            <th className="p-4 text-center font-medium">Số buổi dạy</th>
                            <th className="p-4 text-right font-medium">Tổng lương</th>
                            <th className="p-4 text-right font-medium">Đã trả</th>
                            <th className="p-4 text-right font-medium">Còn nợ (Dự kiến)</th>
                            <th className="p-4 text-center font-medium">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredDebts.length > 0 ? filteredDebts.map(d => (
                            <tr key={d.id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium">{d.teacherName}</td>
                                <td className="p-4 text-gray-600">{d.month}/{d.year}</td>
                                <td className="p-4 text-gray-600">{d.className}</td>
                                <td className="p-4 text-center">{d.totalSessions}</td>
                                <td className="p-4 text-right font-medium">{formatCurrency(d.totalSalary)}</td>
                                <td className="p-4 text-right text-green-600">{formatCurrency(d.paidAmount)}</td>
                                <td className={`p-4 text-right font-bold ${d.remainingDebt > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                    {formatCurrency(d.remainingDebt)}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${d.remainingDebt <= 0 ? 'bg-green-100 text-green-700' :
                                            d.paidAmount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {d.status}
                                    </span>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-500">
                                    {debts.length === 0 ? 'Chưa có dữ liệu công nợ' : 'Không tìm thấy kết quả'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
