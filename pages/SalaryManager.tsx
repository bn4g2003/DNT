import React, { useState, useEffect, useMemo } from 'react';
import { Save, Search, Calculator, DollarSign, TrendingUp, Filter } from 'lucide-react';
import { doc, getDoc, setDoc, collection, query, where, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../src/config/firebase';
import { useStaff } from '../src/hooks/useStaff';
import { Staff } from '../types';
import { formatCurrency } from '../src/utils/currencyUtils';
import { generateMonthlyPayroll } from '../src/services/staffSalaryService'; // New import

export const SalaryManager: React.FC = () => {
    const { staff, loading: staffLoading, updateStaff } = useStaff();
    const [globalBaseSalary, setGlobalBaseSalary] = useState<number>(1800000); // Mặc định 1.8tr
    const [loadingConfig, setLoadingConfig] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDepartment, setFilterDepartment] = useState('ALL');
    const [editedStaff, setEditedStaff] = useState<Record<string, Partial<Staff>>>({});
    const [saving, setSaving] = useState(false);

    // Fetch global configuration
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const docRef = doc(db, 'settings', 'salaryConfig');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setGlobalBaseSalary(docSnap.data().baseSalary || 1800000);
                }
            } catch (err) {
                console.error('Error fetching salary config:', err);
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []);

    const handleGeneratePayroll = async () => {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        if (!confirm(`Bạn có chắc muốn chốt và tạo bảng lương cho tháng ${month}/${year}?
Hành động này sẽ lưu mức lương hiện tại của tất cả nhân viên văn phòng vào lịch sử lương tháng này.`)) return;

        try {
            setSaving(true);
            const count = await generateMonthlyPayroll(month, year);
            alert(`✅ Đã cập nhật bảng lương tháng ${month}/${year} cho ${count} nhân viên thành công!`);
        } catch (error) {
            console.error(error);
            alert('❌ Có lỗi xảy ra khi tạo bảng lương!');
        } finally {
            setSaving(false);
        }
    };

    // Save global configuration
    const saveGlobalConfig = async () => {
        try {
            await setDoc(doc(db, 'settings', 'salaryConfig'), {
                baseSalary: globalBaseSalary,
                updatedAt: new Date().toISOString()
            });
            alert('Đã lưu mức lương cơ sở!');
            // Re-calculate all visible staff? Or just let user click calculate
        } catch (err) {
            console.error('Error saving config:', err);
            alert('Lỗi khi lưu cấu hình!');
        }
    };

    const handleStaffChange = (id: string, field: keyof Staff, value: any) => {
        setEditedStaff(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const getStaffValue = (s: Staff, field: keyof Staff) => {
        if (editedStaff[s.id] && editedStaff[s.id][field] !== undefined) {
            return editedStaff[s.id][field];
        }
        return s[field];
    };

    const calculateSalary = (s: Staff) => {
        const coef = Number(getStaffValue(s, 'salaryCoefficient') || 0);
        const allowance = Number(getStaffValue(s, 'allowance') || 0);
        return (globalBaseSalary * coef) + allowance;
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            const promises = Object.entries(editedStaff).map(async ([id, changeData]) => {
                const changes = changeData as Partial<Staff>;
                // Calculate final base salary (stored as baseSalary in Staff type based on previous rename, 
                // but let's be clear: baseSalary in Staff type from now on = calculated salary?
                // Actually, let's store the calculated value as 'baseSalary' in DB to match generic "Salary" meaning, 
                // OR better, store 'baseSalary' as the result of calculation to be consistent with payroll.

                // Let's re-read types.ts change:
                // salaryCoefficient?: number; // Hệ số lương
                // baseSalary?: number; // Lương thực nhận (đã tính toán)

                const s = staff.find(st => st.id === id);
                if (!s) return;

                const coef = changes.salaryCoefficient !== undefined ? Number(changes.salaryCoefficient) : (s.salaryCoefficient || 0);
                const allowance = changes.allowance !== undefined ? Number(changes.allowance) : (s.allowance || 0);

                const calculatedTotal = (globalBaseSalary * coef) + allowance;

                await updateStaff(id, {
                    ...changes,
                    baseSalary: calculatedTotal // Update the total calculated salary
                });
            });

            await Promise.all(promises);
            setEditedStaff({});
            alert('Đã cập nhật dữ liệu lương thành công!');
        } catch (err) {
            console.error('Error batch updating:', err);
            alert('Có lỗi xảy ra khi cập nhật!');
        } finally {
            setSaving(false);
        }
    };

    const handleAutoCalculateAll = () => {
        if (!confirm('Hành động này sẽ tính toán lại lương cho TẤT CẢ nhân viên trong danh sách lọc dựa trên hệ số và mức lương cơ sở hiện tại. Tiếp tục?')) return;

        const newEdits: Record<string, Partial<Staff>> = {};
        filteredStaff.forEach(s => {
            const coef = Number(getStaffValue(s, 'salaryCoefficient') || 0);
            const allowance = Number(getStaffValue(s, 'allowance') || 0);
            const total = (globalBaseSalary * coef) + allowance;

            // Mark as edited to be saved
            newEdits[s.id] = {
                ...editedStaff[s.id],
                baseSalary: total
            };
        });
        setEditedStaff(prev => ({ ...prev, ...newEdits }));
    };

    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchDept = filterDepartment === 'ALL' || s.department === filterDepartment;
            return matchSearch && matchDept && s.status === 'Active';
        });
    }, [staff, searchTerm, filterDepartment]);

    const departments = ['ALL', ...Array.from(new Set(staff.map(s => s.department || 'Khác')))];

    if (staffLoading || loadingConfig) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý Lương & Thưởng</h1>
                <div className="flex gap-3">
                    <button
                        onClick={handleGeneratePayroll}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-sm">
                        <TrendingUp size={18} /> Chốt lương tháng {new Date().getMonth() + 1}
                    </button>
                    <button
                        onClick={handleAutoCalculateAll}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <Calculator size={18} /> Tự động tính tất cả
                    </button>
                    {Object.keys(editedStaff).length > 0 && (
                        <button
                            onClick={handleSaveChanges}
                            disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                            <Save size={18} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    )}
                </div>
            </div>

            {/* Configuration Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6">
                <div className="bg-indigo-50 p-3 rounded-full">
                    <DollarSign size={24} className="text-indigo-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">Cấu hình lương cơ sở</h3>
                    <p className="text-sm text-gray-500">Mức lương cơ sở (Bậc 1) dùng để nhân với hệ số lương</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="number"
                            value={globalBaseSalary}
                            onChange={(e) => setGlobalBaseSalary(Number(e.target.value))}
                            className="pl-4 pr-12 py-2 border rounded-lg font-medium text-right w-48 focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">VNĐ</span>
                    </div>
                    <button onClick={saveGlobalConfig} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors">
                        Lưu cấu hình
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm nhân viên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-500" />
                    <select
                        value={filterDepartment}
                        onChange={(e) => setFilterDepartment(e.target.value)}
                        className="px-4 py-2 border rounded-lg bg-white"
                    >
                        {departments.map(d => <option key={d} value={d}>{d === 'ALL' ? 'Tất cả phòng ban' : d}</option>)}
                    </select>
                </div>
            </div>

            {/* Salary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                        <tr>
                            <th className="px-6 py-4">Nhân viên</th>
                            <th className="px-6 py-4">Vị trí</th>
                            <th className="px-6 py-4 text-center" style={{ width: '120px' }}>Hệ số (K)</th>
                            <th className="px-6 py-4 text-right">Lương theo hệ số</th>
                            <th className="px-6 py-4 text-right" style={{ width: '150px' }}>Phụ cấp</th>
                            <th className="px-6 py-4 text-right font-bold text-gray-800">Tổng lương</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStaff.map(s => {
                            const coef = Number(getStaffValue(s, 'salaryCoefficient') || 0);
                            const allowance = Number(getStaffValue(s, 'allowance') || 0);
                            const calculatedBase = globalBaseSalary * coef;
                            const total = calculatedBase + allowance;
                            const isEdited = editedStaff[s.id] !== undefined;

                            return (
                                <tr key={s.id} className={`hover:bg-gray-50 transition-colors ${isEdited ? 'bg-blue-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{s.name}</div>
                                        <div className="text-xs text-gray-500">{s.code}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div>{s.position}</div>
                                        <div className="text-xs text-gray-400">{s.department}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="8"
                                            value={getStaffValue(s, 'salaryCoefficient') || 0}
                                            onChange={(e) => {
                                                let val = parseFloat(e.target.value);
                                                if (val > 8) {
                                                    alert('Hệ số lương tối đa là 8');
                                                    val = 8;
                                                }
                                                handleStaffChange(s.id, 'salaryCoefficient', val);
                                            }}
                                            className="w-full p-1 border rounded text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                                        {formatCurrency(calculatedBase)}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <input
                                            type="number"
                                            step="100000"
                                            value={getStaffValue(s, 'allowance') || 0}
                                            onChange={(e) => handleStaffChange(s.id, 'allowance', parseFloat(e.target.value))}
                                            className="w-full p-1 border rounded text-right text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                                        {formatCurrency(total)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredStaff.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        Không tìm thấy nhân viên nào.
                    </div>
                )}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex items-start gap-2">
                <TrendingUp size={18} className="mt-0.5 shrink-0" />
                <div>
                    <strong>Lưu ý:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Công thức: <code>Lương = (Mức lương cơ sở * Hệ số) + Phụ cấp</code></li>
                        <li>Cột "Tổng lương" là giá trị sẽ được lưu vào hệ thống và dùng để tính toán bảng lương hàng tháng.</li>
                        <li>Nhấn "Tự động tính tất cả" để áp dụng công thức cho toàn bộ danh sách hiển thị.</li>
                        <li>Nhớ nhấn "Lưu thay đổi" để cập nhật dữ liệu vào cơ sở dữ liệu.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};
