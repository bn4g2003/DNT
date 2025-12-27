import React, { useState, useEffect } from 'react';
import { FinancialTransaction, TransactionCategory, TransactionType } from '../types';
import { financialService } from '../src/services/financialService';
import { formatCurrency } from '../src/utils/currencyUtils';
import { ArrowDownRight, ArrowUpRight, Filter, RefreshCw, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { exportToExcel } from '../src/utils/excel';

import { useNavigate } from 'react-router-dom';

export const CashflowReport: React.FC = () => {
    const navigate = useNavigate();
    const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>([]);
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [filterType, setFilterType] = useState<TransactionType | 'ALL'>('ALL');
    const [sourceFilter, setSourceFilter] = useState<string>('ALL');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + '01');
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    // Apply Filters and Pagination
    useEffect(() => {
        let filtered = [...allTransactions];

        // Filter by Type
        if (filterType !== 'ALL') {
            filtered = filtered.filter(t => t.type === filterType);
        }

        // Filter by Source
        if (sourceFilter !== 'ALL') {
            filtered = filtered.filter(t => {
                if (sourceFilter === 'Contract') return t.referenceType === 'Contract';
                if (sourceFilter === 'Salary') return t.referenceType === 'Salary';
                if (sourceFilter === 'Depreciation') return t.referenceType === 'Depreciation';
                if (sourceFilter === 'Other') return !['Contract', 'Salary', 'Depreciation'].includes(t.referenceType || '');
                return true;
            });
        }

        // Filter by Category
        if (categoryFilter !== 'ALL') {
            filtered = filtered.filter(t => t.category === categoryFilter);
        }

        setTransactions(filtered);
        setCurrentPage(1); // Reset to first page on filter change
    }, [allTransactions, filterType, sourceFilter, categoryFilter]);

    const fetchData = async () => {
        setLoading(true);
        // Fetch all within date range, then filter locally for flexibility
        const data = await financialService.getTransactions(startDate, endDate);
        setAllTransactions(data);
        setLoading(false);
    };

    const handleSync = async () => {
        if (window.confirm('Hệ thống sẽ quét lại toàn bộ Hợp đồng và Lương để đồng bộ vào Dữ liệu tài chính. Tiếp tục?')) {
            setLoading(true);
            try {
                const count = await financialService.syncFinancialData();
                alert(`Đã đồng bộ thành công! Thêm mới ${count} giao dịch.`);
                fetchData();
            } catch (error) {
                console.error(error);
                alert('Có lỗi xảy ra khi đồng bộ.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleExport = () => {
        const dataToExport = transactions.map(t => ({
            'Ngày': t.date,
            'Loại': t.type,
            'Danh mục': t.category,
            'Mô tả': t.description,
            'Số tiền': t.amount,
            'Nguồn': t.referenceType || 'Khác',
            'PTTT': t.paymentMethod
        }));
        exportToExcel(dataToExport, `Bao_cao_dong_tien_${startDate}_${endDate}`, 'Cashflow');
    };

    const handleRowClick = (t: FinancialTransaction) => {
        if (t.referenceType === 'Contract') {
            navigate('/admin/finance/contracts');
        } else if (t.referenceType === 'Salary') {
            navigate('/admin/salary/manager');
        } else if (t.referenceType === 'Depreciation') {
            navigate('/admin/finance/assets');
        }
    };

    // Calculate totals based on FILTERED data
    const totalIncome = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);

    // Pagination Logic
    const totalPages = Math.ceil(transactions.length / itemsPerPage);
    const currentData = transactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Báo cáo Dòng tiền (Cashflow)</h1>
                    <p className="text-gray-500 text-sm">Theo dõi dòng tiền thu chi chi tiết</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
                    >
                        <Download size={18} />
                        Xuất Excel
                    </button>
                    <button
                        onClick={handleSync}
                        disabled={loading}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        {loading ? 'Đang xử lý...' : 'Đồng bộ dữ liệu'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 mb-1">Tổng thu (Đang lọc)</p>
                    <h3 className="text-2xl font-bold text-green-600 flex items-center gap-2">
                        <ArrowUpRight /> {formatCurrency(totalIncome)}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 mb-1">Tổng chi (Đang lọc)</p>
                    <h3 className="text-2xl font-bold text-red-600 flex items-center gap-2">
                        <ArrowDownRight /> {formatCurrency(totalExpense)}
                    </h3>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 mb-1">Dòng tiền ròng</p>
                    <h3 className={`text-2xl font-bold flex items-center gap-2 ${totalIncome - totalExpense >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                        {formatCurrency(totalIncome - totalExpense)}
                    </h3>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b flex flex-wrap gap-4 items-center bg-gray-50 justify-between">
                    <div className="flex gap-2 items-center flex-wrap">
                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border">
                            <Filter size={16} className="text-gray-500" />
                            <select
                                value={filterType}
                                onChange={e => setFilterType(e.target.value as any)}
                                className="bg-transparent outline-none text-sm min-w-[120px]"
                            >
                                <option value="ALL">Tất cả loại</option>
                                <option value={TransactionType.INCOME}>Khoản Thu</option>
                                <option value={TransactionType.EXPENSE}>Khoản Chi</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border">
                            <Filter size={16} className="text-gray-500" />
                            <select
                                value={sourceFilter}
                                onChange={e => setSourceFilter(e.target.value)}
                                className="bg-transparent outline-none text-sm min-w-[120px]"
                            >
                                <option value="ALL">Tất cả nguồn</option>
                                <option value="Contract">Hợp đồng</option>
                                <option value="Salary">Lương</option>
                                <option value="Depreciation">Khấu hao</option>
                                <option value="Other">Khác</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded border">
                            <Filter size={16} className="text-gray-500" />
                            <select
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                                className="bg-transparent outline-none text-sm min-w-[120px]"
                            >
                                <option value="ALL">Tất cả danh mục</option>
                                {Object.values(TransactionCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 text-left font-medium whitespace-nowrap">Ngày</th>
                                <th className="p-4 text-left font-medium whitespace-nowrap">Nguồn</th>
                                <th className="p-4 text-left font-medium whitespace-nowrap">Danh mục</th>
                                <th className="p-4 text-left font-medium whitespace-nowrap">Mô tả</th>
                                <th className="p-4 text-right font-medium whitespace-nowrap">Số tiền</th>
                                <th className="p-4 text-center font-medium whitespace-nowrap">Loại</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : currentData.length > 0 ? (
                                currentData.map(t => (
                                    <tr
                                        key={t.id}
                                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                                        onClick={() => handleRowClick(t)}
                                        title="Nhấn để xem nguồn dữ liệu"
                                    >
                                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">{t.date}</td>
                                        <td className="p-4 text-sm font-medium text-indigo-600 hover:underline whitespace-nowrap">
                                            {t.referenceType === 'Contract' ? 'Hợp đồng' :
                                                t.referenceType === 'Salary' ? 'Lương' :
                                                    t.referenceType === 'Depreciation' ? 'Khấu hao' :
                                                        (t.referenceType || 'Khác')}
                                        </td>
                                        <td className="p-4 text-sm font-medium whitespace-nowrap">{t.category}</td>
                                        <td className="p-4 text-sm text-gray-500 max-w-xs truncate">{t.description}</td>
                                        <td className={`p-4 text-right font-medium whitespace-nowrap ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                                        </td>
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === TransactionType.INCOME ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {t.type}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t">
                        <div className="text-sm text-gray-500">
                            Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, transactions.length)} trong tổng số {transactions.length} giao dịch
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 rounded text-sm font-medium ${currentPage === page
                                        ? 'bg-blue-600 text-white'
                                        : 'border hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
