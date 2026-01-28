"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, TrendingUp, DollarSign, Users, Scale, AlertCircle, FileText, ArrowRight, X, Loader2, Sparkles, Upload } from 'lucide-react'

// Types
interface Property {
    id: string
    name: string
    neighborhood: string
    class: string
    units: number
    occupancy: number
    noi: number
    avg_rent: number
}

interface YieldOpp {
    unit_id: string
    type: string
    current_rent: number
    market_rent: number
    gain: number
    sqft: number
}

export default function PropertiesPage() {
    const [properties, setProperties] = useState<Property[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProp, setSelectedProp] = useState<Property | null>(null)
    const [yieldOpps, setYieldOpps] = useState<YieldOpp[]>([])
    const [loadingYield, setLoadingYield] = useState(false)

    // Legal Lawyer State
    const [legalOpen, setLegalOpen] = useState(false)
    const [legalFile, setLegalFile] = useState<File | null>(null)
    const [legalQuery, setLegalQuery] = useState('')
    const [legalResult, setLegalResult] = useState('')
    const [analyzingLegal, setAnalyzingLegal] = useState(false)

    const router = useRouter()

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (!token) {
            router.push('/login')
            return
        }

        fetch('http://localhost:8000/properties', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(res => {
                if (res.status === 401) {
                    router.push('/login')
                    throw new Error("Unauthorized")
                }
                return res.json()
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setProperties(data)
                } else {
                    setProperties([])
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [router])

    const handlePropClick = (p: Property) => {
        setSelectedProp(p)
        setYieldOpps([])
        setLoadingYield(true)

        // Fetch Yield Opps
        fetch(`/api/properties/${p.id}/yield`)
            .then(res => res.json())
            .then(data => {
                setYieldOpps(data.opportunities || [])
                setLoadingYield(false)
            })
    }

    const handleLegalAnalyze = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!legalFile || !legalQuery) return

        setAnalyzingLegal(true)
        setLegalResult('')

        const formData = new FormData()
        formData.append('file', legalFile)
        formData.append('query', legalQuery)

        try {
            const res = await fetch('/api/legal/analyze', {
                method: 'POST',
                body: formData
            })
            const data = await res.json()
            setLegalResult(data.result)
        } catch (err) {
            setLegalResult("Error analyzing document.")
        } finally {
            setAnalyzingLegal(false)
        }
    }

    return (
        <div className="relative min-h-screen pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Properties & Assets</h1>
                    <p className="text-gray-500">Asset Optimization • Yield Hunter • Lease Lawyer</p>
                </div>
                <button
                    onClick={() => setLegalOpen(true)}
                    className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-200"
                >
                    <Scale className="w-5 h-5" /> Lease Lawyer Lite
                </button>
            </div>

            {/* Portfolio Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-gray-400">Loading Portfolio...</div>
                ) : properties.map((p, i) => (
                    <div
                        key={i}
                        onClick={() => handlePropClick(p)}
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition cursor-pointer group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 group-hover:scale-110 transition">
                                    <Building2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{p.name}</h3>
                                    <p className="text-xs text-gray-400">{p.neighborhood} • Class {p.class}</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-lg">{p.occupancy}% Occ</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="bg-gray-50 p-3 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">NOI (Est)</p>
                                <p className="text-lg font-bold text-gray-800">${(p.noi / 1000).toFixed(0)}k<span className="text-xs text-gray-400 font-normal">/yr</span></p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Avg Rent</p>
                                <p className="text-lg font-bold text-gray-800">${p.avg_rent}</p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-purple-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>View Yield Opportunities</span>
                            <ArrowRight className="w-4 h-4" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Yield Hunter Drawer */}
            {selectedProp && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedProp(null)}></div>
                    <div className="relative w-full max-w-xl bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <button onClick={() => setSelectedProp(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><X className="w-5 h-5" /></button>

                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                <Sparkles className="text-purple-600" /> Yield Hunter
                            </h2>
                            <p className="text-gray-500 mt-1">Analyzing <span className="font-bold">{selectedProp.name}</span> for revenue gaps.</p>
                        </div>

                        {loadingYield ? (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 space-y-4">
                                <Loader2 className="w-10 h-10 animate-spin text-purple-600" />
                                <p>Scanning unit pricing vs neighborhood comps...</p>
                            </div>
                        ) : yieldOpps.length > 0 ? (
                            <div className="space-y-4">
                                <div className="bg-purple-600 text-white p-6 rounded-2xl shadow-lg shadow-purple-200 mb-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <TrendingUp className="w-6 h-6" />
                                        <p className="font-bold text-lg">Potential Upside Discovered</p>
                                    </div>
                                    <p className="opacity-90">We found <span className="font-bold">{yieldOpps.length} units</span> priced significantly below market value, totaling <span className="font-bold text-green-200">+${(yieldOpps.reduce((sum, item) => sum + item.gain, 0)).toLocaleString()}/yr</span> in potential revenue.</p>
                                </div>

                                {yieldOpps.map((opp, i) => (
                                    <div key={i} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50 transition flex justify-between items-center group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-gray-800">Unit {opp.unit_id}</h4>
                                                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-md text-gray-600 font-bold">{opp.type}</span>
                                            </div>
                                            <p className="text-sm text-gray-500">{opp.sqft} sqft • Current: <span className="text-red-500 font-bold line-through">${opp.current_rent}</span></p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-green-600">${opp.market_rent}</p>
                                            <p className="text-xs font-bold text-purple-600">+{((opp.gain / 12)).toLocaleString()}/mo potential</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600"><TrendingUp /></div>
                                <h3 className="text-gray-800 font-bold mb-1">Fully Optimized</h3>
                                <p>This property is performing at or above market efficiency.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Lease Lawyer Modal */}
            {legalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setLegalOpen(false)}></div>
                    <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-gray-900 text-white p-8 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2"><Scale className="text-purple-400" /> Lease Lawyer Lite</h2>
                                <p className="text-gray-400 mt-1">Upload a Master Lease PDF and ask compliance questions.</p>
                            </div>
                            <button onClick={() => setLegalOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-8">
                            {!legalResult ? (
                                <form onSubmit={handleLegalAnalyze} className="space-y-6">
                                    <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:bg-gray-50 transition relative">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setLegalFile(e.target.files?.[0] || null)}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center gap-2 text-gray-500">
                                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center"><Upload className="w-6 h-6" /></div>
                                            {legalFile ? <p className="font-bold text-purple-600">{legalFile.name}</p> : <p>Drop PDF here or click to upload</p>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Legal Query</label>
                                        <input
                                            type="text"
                                            value={legalQuery}
                                            onChange={(e) => setLegalQuery(e.target.value)}
                                            placeholder="e.g. Does this lease allow for Airbnb subletting?"
                                            className="w-full p-4 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={analyzingLegal || !legalFile || !legalQuery}
                                        className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {analyzingLegal ? <Loader2 className="w-5 h-5 animate-spin" /> : "Analyze Document"}
                                    </button>
                                </form>
                            ) : (
                                <div>
                                    <div className="bg-purple-50 p-6 rounded-2xl mb-6">
                                        <h4 className="font-bold text-purple-900 mb-2">Analysis Result</h4>
                                        <p className="text-gray-800 whitespace-pre-line leading-relaxed">{legalResult}</p>
                                    </div>
                                    <button onClick={() => setLegalResult('')} className="text-gray-500 font-bold hover:text-gray-800">Analyze Another Question</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
