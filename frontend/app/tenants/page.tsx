"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Filter, AlertTriangle, Smile, Meh, Frown, Mail, Zap } from 'lucide-react'

interface Tenant {
    id: string
    name: string
    unit: string
    rent: number
    income: number
    credit: number
    leaseEnd: string
    riskLevel: 'High' | 'Medium' | 'Low'
    riskReason: string
    sentiment: 'Happy' | 'Neutral' | 'Unhappy'
}

export default function TenantsPage() {
    const [tenants, setTenants] = useState<Tenant[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('All') // All, High Risk, At Risk

    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token');
        fetch('http://localhost:8000/tenants', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        })
            .then(res => {
                if (res.status === 401) {
                    router.push('/login');
                    throw new Error("Unauthorized");
                }
                return res.json()
            })
            .then(data => {
                setTenants(data)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }, [router])

    const filteredTenants = tenants.filter(t => {
        if (filter === 'High Risk') return t.riskLevel === 'High';
        if (filter === 'Unhappy') return t.sentiment === 'Unhappy';
        return true;
    });

    // GenAI Simulation for Drafting Email
    const draftEmail = (name: string, reason: string) => {
        const email = `Hi ${name},\n\nWe noticed you might be considering your options. Because we value you (${reason}), we'd like to offer you a fixed renewal rate if you sign this week.\n\nBest,\nManagement`;
        alert("🤖 Copilot Drafted:\n\n" + email);
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Tenants & Risk</h1>
                    <p className="text-gray-500 mt-2">Proactive Retention Console • Found {tenants.length} Active Leases</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilter('All')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === 'All' ? 'bg-purple-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        All Tenants
                    </button>
                    <button
                        onClick={() => setFilter('High Risk')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${filter === 'High Risk' ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-red-50'}`}
                    >
                        <AlertTriangle className="w-4 h-4" /> High Risk
                    </button>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-6 border-b border-gray-100 bg-gray-50/50 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <div className="col-span-3">Tenant Details</div>
                    <div className="col-span-2">Financials</div>
                    <div className="col-span-2">Risk Profile</div>
                    <div className="col-span-2">Why? (AI Insight)</div>
                    <div className="col-span-1 text-center">Sentiment</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-50">
                    {loading ? (
                        <div className="p-12 text-center text-gray-400">Loading Tenant data...</div>
                    ) : filteredTenants.slice(0, 50).map((tenant) => (
                        <div key={tenant.id} className="grid grid-cols-12 gap-4 p-6 items-center hover:bg-purple-50/30 transition-colors group">

                            {/* 1. Details */}
                            <div className="col-span-3">
                                <div className="font-bold text-gray-800">{tenant.name}</div>
                                <div className="text-xs text-gray-400 font-mono mt-1">{tenant.unit} • Lease ends {tenant.leaseEnd}</div>
                            </div>

                            {/* 2. Financials */}
                            <div className="col-span-2">
                                <div className="text-sm font-medium text-gray-700">${tenant.rent.toLocaleString()}/mo</div>
                                <div className="text-xs text-gray-400">Inc: ${(tenant.income / 1000).toFixed(0)}k • FICO: {tenant.credit}</div>
                            </div>

                            {/* 3. Risk Level */}
                            <div className="col-span-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${tenant.riskLevel === 'High' ? 'bg-red-50 border-red-100 text-red-600' :
                                    tenant.riskLevel === 'Medium' ? 'bg-yellow-50 border-yellow-100 text-yellow-600' :
                                        'bg-green-50 border-green-100 text-green-600'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${tenant.riskLevel === 'High' ? 'bg-red-500' :
                                        tenant.riskLevel === 'Medium' ? 'bg-yellow-500' :
                                            'bg-green-500'
                                        }`}></div>
                                    {tenant.riskLevel} Risk
                                </span>
                            </div>

                            {/* 4. Why Column (AI Insight) */}
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500 leading-snug">
                                    {tenant.riskReason}
                                </p>
                            </div>

                            {/* 5. Sentiment */}
                            <div className="col-span-1 flex justify-center">
                                {tenant.sentiment === 'Happy' && <Smile className="w-5 h-5 text-green-400" />}
                                {tenant.sentiment === 'Neutral' && <Meh className="w-5 h-5 text-gray-300" />}
                                {tenant.sentiment === 'Unhappy' && <Frown className="w-5 h-5 text-red-400" />}
                            </div>

                            {/* 6. Action Copilot */}
                            <div className="col-span-2 flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => draftEmail(tenant.name, tenant.riskReason)}
                                    className="p-2 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-600 hover:text-white transition shadow-sm"
                                    title="Draft Retention Offer"
                                >
                                    <Zap className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition">
                                    <Mail className="w-4 h-4" />
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
