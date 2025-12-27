import React, { useState, useEffect } from 'react';
import { FinancialTransaction, TransactionType, TransactionCategory } from '../types';
import { financialService } from '../src/services/financialService';
import { formatCurrency } from '../src/utils/currencyUtils';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { exportToExcel } from '../src/utils/excel';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export const NetProfitReport: React.FC = () => {
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const end = `${year}-${String(month).padStart(2, '0')}-31`;
        financialService.getTransactions(start, end).then(setTransactions);
    }, [month, year]);

    // Calculate Aggregates
    const revenue = transactions
        .filter(t => t.type === TransactionType.INCOME)
        .reduce((sum, t) => sum + t.amount, 0);

    // Group Expenses (excluding WITHDRAWAL)
    const expenseByCategory: Record<string, number> = {};
    let totalOperatingExpense = 0;
    let withdrawalAmount = 0;

    transactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => {
        if (t.category === TransactionCategory.WITHDRAWAL) {
            withdrawalAmount += t.amount;
        } else {
            expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
            totalOperatingExpense += t.amount;
        }
    });

    const expenseData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));

    const operatingProfit = revenue - totalOperatingExpense;
    const remainingProfit = operatingProfit - withdrawalAmount;

    const handleExport = () => {
        // Summary Sheet
        const summaryData = [
            { 'Hạng mục': 'Tổng doanh thu', 'Số tiền': revenue },
            { 'Hạng mục': 'Tổng chi phí vận hành', 'Số tiền': totalOperatingExpense },
            { 'Hạng mục': 'Lợi nhuận vận hành', 'Số tiền': operatingProfit },
            { 'Hạng mục': 'Đã rút lợi nhuận', 'Số tiền': withdrawalAmount },
            { 'Hạng mục': 'Lợi nhuận còn lại', 'Số tiền': remainingProfit },
        ];

        // Details Sheet (Expense Breakdown)
        const expenseDetails = expenseData.map(e => ({
            'Hạng mục chi phí': e.name,
            'Số tiền': e.value,
            'Tỷ trọng': ((e.value / totalOperatingExpense) * 100).toFixed(2) + '%'
        }));

        // We can just export the details for now or a combined view?
        // Let's export the expense breakdown primarily, or row-by-row transactions?
        // User asked for "Transfer data to sheet" for report.

        // Let's export the summary and breakdown.
        // For simplicity, we export the Expense Breakdown for this specific report, 
        // as Cashflow Report already exports raw transactions.
        exportToExcel(expenseDetails, `Bao_cao_loi_nhuan_Thang_${month}_${year}`, 'Chi_tiet_chi_phi');
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Báo cáo Lợi nhuận Ròng (Net Profit)</h1>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors"
                >
                    <Download size={18} />
                    Xuất Excel
                </button>
            </div>

            <div className="flex gap-4 mb-6">
                <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border rounded p-2">
                    {[...Array(12)].map((_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
                </select>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="border rounded p-2">
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Summary Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center space-y-4">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Tổng doanh thu</span>
                        <span className="font-bold text-green-600">{formatCurrency(revenue)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Chi phí vận hành</span>
                        <span className="font-bold text-red-600">{formatCurrency(totalOperatingExpense)}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 pt-2 bg-gray-50 p-2 rounded">
                        <span className="font-medium text-gray-700">Lợi nhuận vận hành</span>
                        <span className={`font-bold ${operatingProfit >= 0 ? 'text-indigo-600' : 'text-orange-600'}`}>
                            {formatCurrency(operatingProfit)}
                        </span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">Đã rút lợi nhuận</span>
                        <span className="font-bold text-gray-500">{formatCurrency(withdrawalAmount)}</span>
                    </div>
                    <div className="flex justify-between text-xl pt-2">
                        <span className="font-bold">Lợi nhuận còn lại</span>
                        <span className={`font-bold ${remainingProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                            {formatCurrency(remainingProfit)}
                        </span>
                    </div>
                </div>

                {/* Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80">
                    <h3 className="text-lg font-medium mb-4">Cơ cấu Chi phí Vận hành</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={expenseData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {expenseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-medium mb-4">Chi tiết Chi phí Vận hành</h3>
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-3 text-left">Hạng mục</th>
                            <th className="p-3 text-right">Số tiền</th>
                            <th className="p-3 text-right">Tỷ trọng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenseData.map((item, idx) => (
                            <tr key={idx} className="border-b">
                                <td className="p-3">{item.name}</td>
                                <td className="p-3 text-right font-medium">{formatCurrency(item.value)}</td>
                                <td className="p-3 text-right text-gray-500">
                                    {totalOperatingExpense > 0 ? ((item.value / totalOperatingExpense) * 100).toFixed(1) + '%' : '0%'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
