"use client"

import { ArrowUpRight, TrendingUp, Users, DollarSign, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'

interface DashboardStats {
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: string;
  totalAnnualNOI: string;
  avgRent: number;
  highRiskTenants: number;
}

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rentResult, setRentResult] = useState<string | null>(null);
  const [churnResult, setChurnResult] = useState<{ level: string, prob: string } | null>(null);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => {
        if (!res.ok) throw new Error("API Failed");
        return res.json();
      })
      .then(data => {
        if (data.error) throw new Error(data.error);
        setStats(data);
      })
      .catch(err => {
        console.error("Dashboard Load Error:", err);
        // Fallback data to prevent crash
        setStats({
          totalUnits: 0,
          occupiedUnits: 0,
          occupancyRate: "0.0",
          totalAnnualNOI: "$0",
          avgRent: 0,
          highRiskTenants: 0
        });
      });
  }, []);

  if (!stats) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
      <div className="flex flex-col items-center gap-4">
        {/* Loading Spinner */}
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">Loading Risk & Valuation Models...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* 1. Header & Search */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Primary Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, Vidur</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Search Bar Placeholder */}
          <div className="bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100 flex items-center gap-2 w-64">
            <span className="text-gray-400">🔍</span>
            <input type="text" placeholder="Search properties..." className="bg-transparent outline-none text-sm w-full" />
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold border-2 border-white shadow-md">
            VG
          </div>
        </div>
      </div>

      {/* 2. Hero Section (Gradient Card) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Graph Card - PURPLE HERO */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#5B4DBC] to-[#4C3FA2] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl transition-all hover:shadow-[#5B4DBC]/30">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/10 rounded-full -ml-16 -mb-16 blur-xl"></div>

          <div className="relative z-10 flex justify-between items-start mb-8">
            <div>
              <h3 className="text-purple-100 font-medium text-lg">Portfolio NOI (Annualized)</h3>
              <div className="flex items-end gap-3 mt-2">
                <h2 className="text-5xl font-bold font-sans tracking-tight">{stats.totalAnnualNOI}</h2>
                <span className="mb-2 px-2 py-1 bg-white/20 rounded-lg text-sm font-medium flex items-center gap-1 backdrop-blur-md">
                  <TrendingUp className="w-3 h-3" /> +12%
                </span>
              </div>
            </div>
            <select className="bg-black/10 border-none text-white text-sm rounded-xl px-4 py-2 cursor-pointer hover:bg-black/20 transition backdrop-blur-md focus:outline-none">
              <option className="text-black">This Year</option>
              <option className="text-black">Last Year</option>
            </select>
          </div>

          {/* Faux Graph Visual */}
          <div className="h-48 w-full flex items-end gap-2 justify-between px-2">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
              <div key={i} className="group relative flex flex-col items-center gap-2 flex-1 h-full justify-end">
                <div
                  className="w-full bg-gradient-to-t from-white/10 to-white/40 rounded-t-xl transition-all duration-300 group-hover:to-white/60 group-hover:scale-y-110 origin-bottom"
                  style={{ height: `${h}%` }}
                ></div>
                <span className="text-xs text-purple-200 opacity-60 group-hover:opacity-100 transition-opacity">{['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side Widgets */}
        <div className="space-y-6">
          {/* Valuation Widget */}
          <div className="bg-[#7E74CC] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <DollarSign className="w-6 h-6" />
            </div>
            <h3 className="text-purple-100 mb-1 font-medium">AI Valuations</h3>
            <p className="text-3xl font-bold">{stats.totalUnits.toLocaleString()}</p>
            <p className="text-sm text-purple-200 opacity-80 mt-1">Units benchmarked today</p>

            <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur-sm border border-white/10">
              <div className="flex justify-between text-sm mb-2">
                <span className="opacity-90">Model Accuracy</span>
                <span className="font-bold">98.2%</span>
              </div>
              <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                <div className="bg-white h-full w-[98%] shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
              </div>
            </div>
          </div>

          {/* Risk Widget - PINK/RED Theme */}
          <div className="bg-[#F871A0] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group hover:scale-[1.02] transition-all duration-300">
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/20 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-pink-100 font-medium">Churn Risk</h3>
                  <p className="text-3xl font-bold mt-1">{stats.highRiskTenants}</p>
                  <p className="text-sm font-medium opacity-90">High Risk Tenants</p>
                </div>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                  <Activity className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-white text-pink-500 py-2 rounded-xl text-sm font-bold shadow-lg shadow-pink-900/10 hover:bg-gray-50 transition active:scale-95">View List</button>
                <button className="px-4 py-2 bg-black/10 rounded-xl text-sm font-medium hover:bg-black/20 transition backdrop-blur-md">Action</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Occupancy Rate', val: `${stats.occupancyRate}%`, sub: '+2.1% vs Market', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Monthly Rent', val: `$${(stats.avgRent || 0).toLocaleString()}`, sub: 'Outperforming', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Renewals', val: '28', sub: 'Action Required', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[2rem] flex items-center gap-6 shadow-sm hover:shadow-lg transition-all border border-gray-100 group">
            <div className={`w-16 h-16 rounded-2xl ${stat.bg} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-wide">{stat.label}</p>
              <h4 className="text-3xl font-bold text-gray-800 mt-1 tracking-tight">{stat.val}</h4>
              <p className={`text-xs font-bold mt-2 flex items-center gap-1 ${stat.label === 'Pending Renewals' ? 'text-orange-500' : 'text-green-500'}`}>
                {stat.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 5. Interactive AI Models Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Rent Estimator Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-800">Rent Estimator</h3>
              <p className="text-sm text-gray-400">Powered by Gradient Boosting (v4)</p>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              neighborhood: formData.get('neighborhood'),
              property_class: formData.get('class'),
              unit_type: formData.get('type'),
              sqft: parseInt(formData.get('sqft') as string)
            };

            fetch('/api/predict', {
              method: 'POST',
              body: JSON.stringify({ type: 'rent', data })
            })
              .then(res => res.json())
              .then(res => setRentResult(res.predicted_rent))
              .catch(err => alert('Error predicting rent'));
          }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <select name="neighborhood" className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-200 outline-none">
                <option value="Tribeca">Tribeca</option>
                <option value="Financial District">Financial District</option>
                <option value="Upper East Side">Upper East Side</option>
                <option value="Harlem">Harlem</option>
                <option value="East Village">East Village</option>
              </select>
              <select name="class" className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-200 outline-none">
                <option value="A">Class A (Luxury)</option>
                <option value="B">Class B (Standard)</option>
                <option value="C">Class C (Value)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <select name="type" className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-200 outline-none">
                <option value="Studio">Studio</option>
                <option value="1BD">1 Bedroom</option>
                <option value="2BD">2 Bedroom</option>
                <option value="3BD">3 Bedroom</option>
              </select>
              <input name="sqft" type="number" placeholder="SqFt (e.g. 850)" defaultValue={850} className="bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-purple-200 outline-none" />
            </div>
            <button type="submit" className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl hover:bg-purple-700 transition active:scale-95 shadow-lg shadow-purple-200">
              Run Valuation Model
            </button>
          </form>

          {/* RESULT AREA - Rent */}
          {rentResult && (
            <div className="mt-6 bg-purple-50 rounded-xl p-4 border border-purple-100 animate-in fade-in slide-in-from-top-2">
              <p className="text-gray-500 text-sm mb-1 text-center">Estimated Yearly Rent</p>
              <div className="flex justify-center items-center gap-2 text-purple-700">
                <span className="text-3xl font-bold">${rentResult}</span>
                <span className="text-sm font-medium opacity-70">/ month</span>
              </div>
            </div>
          )}
        </div>

        {/* Churn Risk Calculator */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-800">Churn Riskometer</h3>
              <p className="text-sm text-gray-400">Powered by XGBoost (v2)</p>
            </div>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = {
              income: parseInt(formData.get('income') as string),
              credit_score: parseInt(formData.get('credit') as string),
              market_rent: parseInt(formData.get('rent') as string),
              sqft: 800, // Defaulting for simplicity in UI
              unit_type: '1BD',
              property_class: 'B',
              neighborhood: 'Harlem'
            };

            fetch('/api/predict', {
              method: 'POST',
              body: JSON.stringify({ type: 'churn', data })
            })
              .then(res => res.json())
              .then(res => setChurnResult({ level: res.risk_level, prob: (res.churn_probability * 100).toFixed(1) }))
              .catch(err => alert('Error calculating risk'));
          }} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 ml-4 mb-1 block">Annual Income</label>
              <input name="income" type="number" placeholder="$100,000" defaultValue={100000} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-pink-200 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 ml-4 mb-1 block">Credit Score</label>
                <input name="credit" type="number" placeholder="720" defaultValue={720} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-pink-200 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 ml-4 mb-1 block">Monthly Rent</label>
                <input name="rent" type="number" placeholder="$3,500" defaultValue={3500} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-pink-200 outline-none" />
              </div>
            </div>
            <button type="submit" className="w-full bg-pink-500 text-white font-bold py-4 rounded-xl hover:bg-pink-600 transition active:scale-95 shadow-lg shadow-pink-200">
              Calculate Retention Risk
            </button>
          </form>

          {/* RESULT AREA - Churn */}
          {churnResult && (
            <div className={`mt-6 rounded-xl p-4 border animate-in fade-in slide-in-from-top-2 ${churnResult.level === 'High' ? 'bg-red-50 border-red-100 text-red-700' :
                churnResult.level === 'Medium' ? 'bg-yellow-50 border-yellow-100 text-yellow-700' :
                  'bg-green-50 border-green-100 text-green-700'
              }`}>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-lg">Risk Assessment</span>
                <span className={`px-2 py-1 rounded text-xs font-bold bg-white/50 border border-current`}>
                  {churnResult.level.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm opacity-80">Churn Probability</span>
                <span className="text-2xl font-bold">{churnResult.prob}%</span>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
