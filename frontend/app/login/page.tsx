"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Instagram, Twitter, Linkedin, Github } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("username", username);
            formData.append("password", password);

            const res = await fetch("http://localhost:8000/token", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Invalid credentials");
            }

            const data = await res.json();

            // Store Token
            localStorage.setItem("token", data.access_token);
            localStorage.setItem("user_role", data.role);
            localStorage.setItem("user_pid", data.property_id || "ALL");
            localStorage.setItem("username", data.username);

            router.push("/");
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        alert("Google Login is not fully configured without Client ID.");
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#F3F4F6] p-4 lg:p-8 font-sans">

            {/* Main Card Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-6xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px]"
            >

                {/* --- LEFT PANEL (Artistic) --- */}
                <div className="md:w-[45%] lg:w-[45%] relative bg-gray-900 p-8 flex flex-col justify-between overflow-hidden">
                    {/* Background Image */}
                    <div className="absolute inset-2 rounded-[2rem] overflow-hidden">
                        <img
                            src="/login-bg.png"
                            alt="Building"
                            className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-[20s]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/40 mix-blend-multiply"></div>
                        <div className="absolute inset-0 bg-purple-900/20 mix-blend-overlay"></div>
                    </div>

                    {/* Top Content */}
                    <div className="relative z-10 flex justify-between items-center text-white/90">
                        <span className="font-semibold tracking-wide text-sm uppercase">ASA Real Estate</span>
                        <div className="flex gap-4">
                            {/* <button className="text-sm font-medium hover:text-white transition-colors">Sign Up</button> */}
                            <button className="px-5 py-2 rounded-full border border-white/30 backdrop-blur-md text-sm font-medium hover:bg-white/10 transition">Join Us</button>
                        </div>
                    </div>

                    {/* Bottom Content */}
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 rounded-full border-2 border-white/20 p-0.5">
                                <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                                    VG
                                </div>
                            </div>
                            <div>
                                <h4 className="text-white font-bold">Vidur Gupta</h4>
                                <p className="text-white/60 text-xs">Founder & CEO</p>
                            </div>
                        </div>

                        {/* Navigation Arrows (Visual Only) */}
                        <div className="flex gap-2 mt-6 absolute bottom-0 right-0">
                            <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition">
                                <ArrowRight className="w-4 h-4 rotate-180" />
                            </button>
                            <button className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition">
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>


                {/* --- RIGHT PANEL (Form) --- */}
                <div className="md:w-[55%] lg:w-[55%] bg-white p-12 lg:p-16 flex flex-col justify-center relative">

                    {/* Top Right Language/Logo */}
                    <div className="absolute top-8 right-8 lg:right-16 flex items-center">
                        <span className="flex items-center gap-2 text-sm font-medium text-gray-500 border rounded-full px-3 py-1 cursor-pointer hover:bg-gray-50">
                            🇺🇸 EN <span className="text-xs">▼</span>
                        </span>
                    </div>

                    <div className="absolute top-8 left-12 lg:left-16">
                        <h2 className="text-xl font-black tracking-tighter text-gray-900">ASA<span className="text-purple-600">.AI</span></h2>
                    </div>

                    {/* Form Content */}
                    <div className="max-w-md w-full mx-auto mt-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Hi User</h1>
                        <p className="text-gray-500 mb-10">Welcome to ASA Analytics</p>

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-6 py-4 rounded-xl border border-gray-200 bg-white text-gray-800 focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-6 py-4 rounded-xl border border-gray-200 bg-white text-gray-800 focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all placeholder:text-gray-400"
                                />
                            </div>

                            <div className="flex justify-end">
                                <a href="#" className="text-sm font-medium text-red-400 hover:text-red-500">Forgot password?</a>
                            </div>

                            {/* Divider */}
                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-100"></div>
                                <span className="flex-shrink mx-4 text-gray-300 text-sm">or</span>
                                <div className="flex-grow border-t border-gray-100"></div>
                            </div>

                            {/* Google Button */}
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full py-3.5 border border-gray-200 rounded-xl flex items-center justify-center gap-3 text-gray-700 font-medium hover:bg-gray-50 transition active:scale-[0.98]"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Login with Google
                            </button>

                            {/* Main Login Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-[#5B4DBC] hover:bg-[#4C3FA2] text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? "Signing In..." : "Login"}
                            </button>

                            {error && (
                                <p className="text-center text-red-500 text-sm mt-2">{error}</p>
                            )}

                            <p className="text-center text-gray-400 text-sm mt-8">
                                Don't have an account? <a href="#" className="text-red-400 font-medium hover:text-red-500">Sign up</a>
                            </p>

                        </form>

                        {/* Social Icons Footer */}
                        <div className="mt-12 flex justify-center gap-6 text-gray-300">
                            <Twitter className="w-5 h-5 hover:text-gray-500 cursor-pointer transition" />
                            <Instagram className="w-5 h-5 hover:text-gray-500 cursor-pointer transition" />
                            <Linkedin className="w-5 h-5 hover:text-gray-500 cursor-pointer transition" />
                            <Github className="w-5 h-5 hover:text-gray-500 cursor-pointer transition" />
                        </div>

                    </div>
                </div>

            </motion.div>
        </div>
    );
}
