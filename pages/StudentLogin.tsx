/**
 * Student Login Page
 * Trang đăng nhập cho học viên
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, User, Lock, LogIn, AlertCircle } from 'lucide-react';
import { StudentAuthService } from '../src/services/studentAuthService';

export const StudentLogin: React.FC = () => {
    const [studentCode, setStudentCode] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!studentCode.trim() || !password.trim()) {
            setError('Vui lòng nhập mã học viên và mật khẩu');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await StudentAuthService.login(studentCode, password);
            navigate('/student/portal');
        } catch (err: any) {
            setError(err.message || 'Đăng nhập thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Brand */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-20 text-white/20">
                        <GraduationCap size={120} strokeWidth={1} />
                    </div>
                    <div className="absolute bottom-40 right-32 text-white/15">
                        <GraduationCap size={80} strokeWidth={1} />
                    </div>
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-center px-16 py-20">
                    <div className="space-y-8">
                        <div className="inline-block">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border-2 border-white/20">
                                <img
                                    src="/logo.jpg"
                                    alt="DNT Logo"
                                    className="w-48 h-48 object-contain drop-shadow-2xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h1 className="text-5xl font-bold text-white leading-tight">
                                Cổng thông tin<br />Học viên
                            </h1>
                            <div className="w-24 h-1 bg-white/80"></div>
                            <p className="text-xl text-white/90 font-light max-w-md leading-relaxed">
                                Xem lịch học, bài tập và thông tin cá nhân của bạn
                            </p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-2xl mb-4">
                            <GraduationCap size={40} className="text-emerald-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-800">Cổng thông tin Học viên</h1>
                    </div>

                    {/* Form */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng nhập</h2>
                        <p className="text-gray-500 mb-6">Nhập mã học viên và mật khẩu của bạn</p>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                                <AlertCircle size={18} />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mã học viên
                                </label>
                                <div className="relative">
                                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        value={studentCode}
                                        onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                                        placeholder="VD: HV001"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Nhập mật khẩu"
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">Mật khẩu mặc định: 123456</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        Đang đăng nhập...
                                    </>
                                ) : (
                                    <>
                                        <LogIn size={20} />
                                        Đăng nhập
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <a href="#/login" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                                Đăng nhập dành cho Nhân viên / Giáo viên →
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
