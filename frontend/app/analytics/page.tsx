"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, AreaChart, Area
} from 'recharts'
import { TrendingUp, Activity, PieChart, FileText, Sparkles, Loader2, ArrowRight, Zap } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Scenario State
    const [rentChange, setRentChange] = useState(0)
    const [occChange, setOccChange] = useState(0)
    const [scenarioResult, setScenarioResult] = useState<any>(null)
    const [runningScenario, setRunningScenario] = useState(false)

    // Report State
    const [report, setReport] = useState('')
    const [generatingReport, setGeneratingReport] = useState(false)

    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        fetch('http://localhost:8000/analytics/data', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => {
                if (res.status === 401) {
                    router.push('/login');
                    throw new Error("Unauthorized");
                }
                return res.json()
            })
            .then(d => {
                setData(d)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [router])

    const runScenario = async () => {
        setRunningScenario(true)
        setScenarioResult(null)
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/analytics/scenario', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ rent_change_pct: rentChange, occupancy_change_pct: occChange })
            })
            const result = await res.json()
            setScenarioResult(result)
        } catch (e) {
            console.error(e)
        } finally {
            setRunningScenario(false)
        }
    }

    const generateReport = async () => {
        setGeneratingReport(true)
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/analytics/report', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            const result = await res.json()
            setReport(result.report)
        } catch (e) {
            console.error(e)
        } finally {
            setGeneratingReport(false)
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading Analytics Engine...</div>

    return (
        <div className="min-h-screen pb-20 animate-in fade-in space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Executive Analytics</h1>
                <p className="text-gray-500">CFO Dashboard • Scenario Modeling • Deep Agent Reporting</p>
            </div>

            {/* Top Row: Scenario Simulator */}
            <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <Zap className="w-32 h-32 text-purple-600" />
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <Activity className="text-purple-600" /> Scenario Simulator
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-4">
                    {/* Left Col: Inputs + Revenue Result */}
                    <div className="md:col-span-5 space-y-6">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                                    Rent Change
                                    <span className={rentChange > 0 ? "text-green-600" : "text-red-500"}>{rentChange > 0 ? '+' : ''}{rentChange}%</span>
                                </label>
                                <input
                                    type="range" min="-20" max="20" step="1"
                                    value={rentChange} onChange={(e) => setRentChange(parseInt(e.target.value))}
                                    className="w-full accent-purple-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>-20%</span>
                                    <span>0%</span>
                                    <span>+20%</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                                    Occupancy Impact
                                    <span className={occChange > 0 ? "text-green-600" : "text-red-500"}>{occChange > 0 ? '+' : ''}{occChange}%</span>
                                </label>
                                <input
                                    type="range" min="-10" max="10" step="1"
                                    value={occChange} onChange={(e) => setOccChange(parseInt(e.target.value))}
                                    className="w-full accent-purple-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>-10%</span>
                                    <span>0%</span>
                                    <span>+10%</span>
                                </div>
                            </div>

                            <button
                                onClick={runScenario}
                                disabled={runningScenario}
                                className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2 shadow-lg"
                            >
                                {runningScenario ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                                Run Simulation
                            </button>

                            {/* Revenue Delta Moved Below Button */}
                            {scenarioResult && (
                                <div className="bg-gray-50 p-6 rounded-2xl flex flex-col justify-center border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                    <p className="text-gray-400 font-bold text-xs uppercase mb-1 tracking-wider">Projected Revenue Delta</p>
                                    <p className={`text-3xl font-bold ${scenarioResult.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {scenarioResult.delta >= 0 ? '+' : '-'}${Math.abs(scenarioResult.delta).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Annual Portfolio Impact</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col: AI Analysis */}
                    <div className="md:col-span-7">
                        {scenarioResult ? (
                            <div className="h-full bg-purple-50 p-8 rounded-3xl border border-purple-100 flex flex-col animate-in slide-in-from-right duration-500">
                                <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2 text-lg">
                                    <Sparkles className="w-5 h-5" /> AI Market Sanity Check
                                </h4>
                                <div className="prose prose-sm prose-purple max-w-none text-gray-700 leading-relaxed">
                                    <ReactMarkdown
                                        components={{
                                            a: ({ node, ...props }) => <a {...props} className="text-purple-600 underline font-bold hover:text-purple-800" target="_blank" rel="noopener noreferrer" />
                                        }}
                                    >
                                        {scenarioResult.ai_analysis}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200 p-10">
                                <Activity className="w-12 h-12 mb-4 opacity-20" />
                                <p>Adjust sliders and run simulation to see AI analysis.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Middle Row: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-[400px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><TrendingUp className="text-green-500" /> Rent Growth vs Market</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <LineChart data={data.rent_growth}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} unit="%" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend />
                            <Line type="monotone" dataKey="portfolio" stroke="#7C3AED" strokeWidth={3} name="Our Portfolio" activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="market" stroke="#9CA3AF" strokeWidth={2} strokeDasharray="5 5" name="NYC Market" />
                        </LineChart>
                    </ResponsiveContainer>
                </section>

                <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm h-[400px]">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><PieChart className="text-blue-500" /> Occupancy Trend</h3>
                    <ResponsiveContainer width="100%" height="80%">
                        <AreaChart data={data.occupancy}>
                            <defs>
                                <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="quarter" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} />
                            <YAxis domain={[90, 100]} axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF' }} unit="%" />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorOcc)" strokeWidth={3} name="Occupancy %" />
                        </AreaChart>
                    </ResponsiveContainer>
                </section>
            </div>

            {/* Bottom Row: Deep Agent Report */}
            <section className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><FileText className="text-purple-600" /> Quarterly Report Writer</h2>
                        <p className="text-gray-500 mt-1">Powered by Autonomous Deep Research Agents</p>
                    </div>
                    <button
                        onClick={generateReport}
                        disabled={generatingReport}
                        className="bg-purple-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-purple-700 transition shadow-xl shadow-purple-200 flex items-center gap-2"
                    >
                        {generatingReport ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        {generatingReport ? "Agents Researching..." : "Generate Q1 Report"}
                    </button>
                </div>

                {generatingReport && (
                    <div className="p-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200 animate-pulse">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 animate-spin"><Loader2 className="w-8 h-8" /></div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">Deep Agent Active</h3>
                                <p className="text-gray-500">Analyzing macro trends, reading regulatory updates, and synthesizing data...</p>
                            </div>
                        </div>
                    </div>
                )}

                {report && !generatingReport && (
                    <div className="prose prose-purple max-w-none bg-gray-50 p-8 rounded-2xl border border-gray-100">
                        <ReactMarkdown
                            components={{
                                a: ({ node, ...props }) => <a {...props} className="text-purple-600 underline font-bold hover:text-purple-800" target="_blank" rel="noopener noreferrer" />
                            }}
                        >
                            {report}
                        </ReactMarkdown>
                    </div>
                )}
            </section>
        </div>
    )
}
