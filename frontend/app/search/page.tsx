"use client"

import { useState, useEffect } from 'react'
import { Search, MapPin, Sparkles, TrendingUp, TrendingDown, ArrowRight, X, Loader2 } from 'lucide-react'

interface Listing {
    title: string
    location: string
    price: number
    ai_value: number
    delta: number
    verdict: string
    sqft: number
    type: string
    link: string
}

export default function MarketSearchPage() {
    const [listings, setListings] = useState<Listing[]>([])
    const [filteredListings, setFilteredListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [analyzing, setAnalyzing] = useState(false)
    const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
    const [analysisResult, setAnalysisResult] = useState<string | null>(null)

    useEffect(() => {
        // Initial load
        fetchListings();
    }, [])

    const fetchListings = (query = "") => {
        setLoading(true);
        const url = query ? `/api/search?query=${encodeURIComponent(query)}` : '/api/search';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setListings(data)
                    setFilteredListings(data)
                } else {
                    setListings([])
                    setFilteredListings([])
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            })
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchListings(searchQuery);
    }

    const runLikelyAnalysis = async (listing: Listing) => {
        setSelectedListing(listing)
        setAnalyzing(true)
        setAnalysisResult(null)

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                body: JSON.stringify({
                    query: `Analyze investment potential for ${listing.title} at ${listing.price}/mo vs AI Value ${listing.ai_value}.`,
                    location: listing.location
                })
            })
            const data = await res.json()
            setAnalysisResult(data.result)
        } catch (error) {
            setAnalysisResult("Agent failed to connect.")
        } finally {
            setAnalyzing(false)
        }
    }

    const generatePDF = async () => {
        if (!selectedListing || !analysisResult) return false;

        try {
            const res = await fetch('/api/generate-memo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: selectedListing.title,
                    content: analysisResult
                })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `investment_memo_${selectedListing.verdict}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                return true;
            }
        } catch (err) {
            console.error(err);
        }
        return false;
    }

    return (
        <div className="relative min-h-screen pb-12 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Market Search</h1>
                <p className="text-gray-500 mb-6">"The Oracle" • AI-Powered Acquisition Engine</p>
                <form onSubmit={handleSearch} className="relative max-w-2xl">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Search className="h-5 w-5 text-purple-400" /></div>
                    <input type="text" placeholder="Ask the Oracle..." className="w-full pl-12 pr-4 py-4 rounded-2xl border-none shadow-lg shadow-purple-100 bg-white text-gray-700 outline-none focus:ring-2 focus:ring-purple-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    <button type="submit" className="absolute right-2 top-2 bottom-2 bg-purple-600 text-white px-6 rounded-xl font-bold hover:bg-purple-700">Search</button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? <div className="col-span-full text-center py-20 text-gray-400">Loading Market Data...</div> : filteredListings.length === 0 ? <div className="col-span-full text-center py-20 text-gray-400">No listings found matching your criteria.</div> : filteredListings.map((l, i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 group flex flex-col justify-between h-[380px]">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div><h3 className="font-bold text-gray-800 line-clamp-1" title={l.title}>{l.title}</h3><div className="flex items-center gap-1 text-gray-400 text-xs mt-1"><MapPin className="w-3 h-3" /> {l.location}</div></div>
                                <div className={`px-2 py-1 rounded-lg text-xs font-bold ${l.verdict === 'Undervalued' ? 'bg-green-100 text-green-700' : l.verdict === 'Overvalued' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>{l.verdict}</div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 mb-4 relative overflow-hidden">
                                {l.verdict === 'Undervalued' && <div className="absolute top-0 right-0 p-2 opacity-10"><TrendingUp className="w-12 h-12 text-green-600" /></div>}
                                <div className="grid grid-cols-2 gap-4">
                                    <div><p className="text-xs text-gray-400 uppercase font-bold">List Price</p><p className="text-xl font-bold text-gray-800">${l.price}</p></div>
                                    <div><p className="text-xs text-purple-400 uppercase font-bold flex items-center gap-1"><Sparkles className="w-3 h-3" /> AI Value</p><p className="text-xl font-bold text-purple-600">${l.ai_value}</p></div>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-200/50 flex justify-between text-xs"><span className="text-gray-400">{l.type} • {l.sqft} sqft</span><span className={`font-bold ${l.delta > 0 ? 'text-green-500' : 'text-red-500'}`}>{l.delta > 0 ? `+${l.delta} Equity` : `${l.delta} Premium`}</span></div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-auto">
                            <a href={l.link} target="_blank" className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm text-center hover:bg-gray-50 transition">View Listing</a>
                            <button onClick={() => runLikelyAnalysis(l)} className="flex-1 py-3 rounded-xl bg-black text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-lg shadow-gray-200"><Sparkles className="w-4 h-4" /> Deep Analyze</button>
                        </div>
                    </div>
                ))}
            </div>

            {selectedListing && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setSelectedListing(null)}></div>
                    <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <button onClick={() => setSelectedListing(null)} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition"><X className="w-5 h-5" /></button>
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Sparkles className="text-purple-600" /> Investment Analyst</h2>
                            <p className="text-gray-500 mt-1">Deep Dive Report: <span className="font-bold text-gray-800">{selectedListing.title}</span></p>
                        </div>
                        {analyzing ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4"><Loader2 className="w-12 h-12 text-purple-600 animate-spin" /><div className="text-center space-y-1"><p className="font-bold text-gray-800 text-lg">Agent is researching...</p><p className="text-sm text-gray-400">Scanning local zoning laws...</p></div></div>
                        ) : (
                            <div className="prose prose-purple max-w-none">
                                <div className="bg-purple-50 p-6 rounded-2xl mb-8 border border-purple-100">
                                    <h3 className="text-purple-900 font-bold m-0 mb-2">Verdict: {selectedListing.verdict}</h3>
                                    <p className="text-purple-700 text-sm m-0">Internal Valuation: <span className="font-bold">${selectedListing.ai_value}</span> vs List: <span className="font-bold">${selectedListing.price}</span>.</p>
                                </div>
                                <div className="text-gray-700 leading-relaxed whitespace-pre-line font-mono text-sm bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    {analysisResult || "No analysis generated."}
                                </div>
                                <div className="mt-8 pt-8 border-t border-gray-100 flex gap-4">
                                    <button
                                        onClick={async (e) => {
                                            const btn = e.currentTarget;
                                            btn.innerText = "Generating PDF...";
                                            btn.disabled = true;
                                            const success = await generatePDF();
                                            if (success) {
                                                btn.innerText = "✅ PDF Downloaded";
                                                btn.className = "flex-1 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 shadow-xl shadow-green-200 transition";
                                            } else {
                                                btn.innerText = "Error (Try Again)";
                                                btn.disabled = false;
                                            }
                                        }}
                                        className="flex-1 bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 shadow-xl shadow-purple-200 transition"
                                    >
                                        Generate Investment Memo (PDF)
                                    </button>
                                    <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-50 transition">
                                        Share with Committee
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
