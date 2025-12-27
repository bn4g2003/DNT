
import React, { useState, useEffect } from 'react';
import { financialService } from '../src/services/financialService';
import { FinancialTransaction, TransactionType, TransactionCategory } from '../types';
import { formatCurrency } from '../src/utils/currencyUtils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area
} from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Users } from 'lucide-react';

export const FinancialDashboard: React.FC = () => {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [startDate, setStartDate] = useState(`${new Date().getFullYear()}-01-01`);
    const [endDate, setEndDate] = useState(`${new Date().getFullYear()}-12-31`);
    const [loading, setLoading] = useState(false);

    const loadData = async () => {
        setLoading(true);
        const data = await financialService.getTransactions(startDate, endDate);
        setTransactions(data);
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, [startDate, endDate]);

    const handleSync = async () => {
        if (window.confirm('Hệ thống sẽ quét lại toàn bộ Hợp đồng và Lương để đồng bộ vào Dữ liệu tài chính. Tiếp tục?')) {
            setLoading(true);
            try {
                const count = await financialService.syncFinancialData();
                alert(`Đã đồng bộ thành công! Thêm mới ${count} giao dịch.`);
                loadData();
            } catch (error) {
                console.error(error);
                alert('Có lỗi xảy ra khi đồng bộ.');
            } finally {
                setLoading(false);
            }
        }
    };

    // Process data for charts
    const monthlyData = Array(12).fill(0).map((_, idx) => {
        const month = idx + 1;
        // Logic modified to respect filter range if needed, but here we show monthly trend for the year of StartDate generally
        // Or if filter is strict, we show what is inside.
        // For simple chart: group by month of transaction date
        const monthTransactions = transactions.filter(t => new Date(t.date).getMonth() + 1 === month);
        const income = monthTransactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
        const expense = monthTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
        return {
            name: `Tháng ${month}`,
            DoanhThu: income,
            ChiPhi: expense,
            LoiNhuan: income - expense
        };
    });

    const totalRevenue = transactions.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
    const netProfit = totalRevenue - totalExpense;

    return (
        <div className="p-6">
            <div className="flex justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold mb-2">Tài chính Dashboard</h1>
                    <p className="text-gray-500 text-sm">Tổng quan tình hình tài chính từ dữ liệu thực tế</p>
                </div>
                <button onClick={handleSync} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
                    {loading ? 'Đang xử lý...' : 'Đồng bộ Dữ liệu'}
                </button>
            </div>

            <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border rounded p-2 text-sm" />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border rounded p-2 text-sm" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <DashboardCard title="Tổng Doanh Thu" value={totalRevenue} color="text-green-600" icon={DollarSign} />
                <DashboardCard title="Tổng Chi Phí" value={totalExpense} color="text-red-600" icon={TrendingDown} />
                <DashboardCard title="Lợi Nhuận Ròng" value={netProfit} color="text-indigo-600" icon={TrendingUp} />
                <DashboardCard title="Tỷ suất lợi nhuận" value={(totalRevenue > 0 ? (netProfit / totalRevenue * 100).toFixed(1) : 0) + '%'} color="text-blue-600" icon={Users} isPercent />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold mb-4">Biểu đồ Doanh thu & Chi phí</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(val) => val >= 1000000 ? `${val / 1000000} M` : val} />
                            <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                            <Legend />
                            <Bar dataKey="DoanhThu" fill="#10B981" name="Doanh Thu" />
                            <Bar dataKey="ChiPhi" fill="#EF4444" name="Chi Phí" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-96">
                    <h3 className="text-lg font-bold mb-4">Biểu đồ Lợi nhuận</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={monthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis tickFormatter={(val) => val >= 1000000 ? `${val / 1000000} M` : val} />
                            <Tooltip formatter={(val) => formatCurrency(Number(val))} />
                            <Legend />
                            <Area type="monotone" dataKey="LoiNhuan" stroke="#6366F1" fill="#818CF8" name="Lợi Nhuận" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const DashboardCard: React.FC<{ title: string, value: string | number, color: string, icon: any, isPercent?: boolean }> = ({ title, value, color, icon: Icon, isPercent }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h3 className={`text - 2xl font - bold ${color} `}>
                {typeof value === 'number' && !isPercent ? formatCurrency(value) : value}
            </h3>
        </div>
        <div className={`p - 3 rounded - full ${color.replace('text', 'bg').replace('600', '100')} `}>
            <Icon className={color} size={24} />
        </div>
    </div>
);
