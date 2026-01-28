"use client"

import { ArrowUpRight, TrendingUp, Users, DollarSign, Activity } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: string;
  totalAnnualNOI: string;
  avgRent: number;
  highRiskTenants: number;
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [rentResult, setRentResult] = useState<string | null>(null);
  const [churnResult, setChurnResult] = useState<{ level: string, prob: string } | null>(null);

  useEffect(() => {
    // 1. Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // 2. Fetch Data from Real Endpoint (Properties)
    fetch('http://localhost:8000/properties', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (res.status === 401) {
          router.push('/login');
          throw new Error("Unauthorized");
        }
        if (!res.ok) throw new Error("API Failed");
        return res.json();
      })
      .then(data => {
        // Calculate Aggregate Stats from Properties
        if (!Array.isArray(data)) throw new Error("No Data");

        let totalUnits = 0;
        let totalNOI = 0;
        let weightedOcc = 0;
        let totalRent = 0;
        let count = 0;

        data.forEach((p: any) => {
          totalUnits += p.units;
          totalNOI += p.noi;
          weightedOcc += (p.occupancy * p.units);
          totalRent += p.avg_rent;
          count++;
        });

        const avgRent = count > 0 ? Math.round(totalRent / count) : 0;
        const occupancyRate = totalUnits > 0 ? (weightedOcc / totalUnits).toFixed(1) : "0.0";
        const occupiedUnits = Math.round(totalUnits * (parseFloat(occupancyRate) / 100));

        setStats({
          totalUnits,
          occupiedUnits,
          occupancyRate,
          totalAnnualNOI: `$${totalNOI.toLocaleString()}`,
          avgRent,
          highRiskTenants: Math.round(totalUnits * 0.08) // Mocking risk as ~8% of portfolio
        });
      })
      .catch(err => {
        console.error("Dashboard Load Error:", err);
        // Fallback data
        setStats({
          totalUnits: 0,
          occupiedUnits: 0,
          occupancyRate: "0.0",
          totalAnnualNOI: "$0",
          avgRent: 0,
          highRiskTenants: 0
        });
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Portfolio Dashboard</h1>
            <p className="text-gray-500 mt-1">Real-time analytics for your real estate portfolio</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/properties')}
              className="px-6 py-3 bg-white rounded-xl shadow-sm border border-gray-200 font-medium text-gray-700 hover:bg-gray-50 transition flex items-center gap-2"
            >
              Properties <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push('/analytics')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 font-medium hover:bg-blue-700 transition flex items-center gap-2"
            >
              Analytics <TrendingUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Units Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-500">Total Units</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalUnits ?? '—'}</p>
            <p className="text-sm text-gray-400 mt-1">{stats?.occupiedUnits ?? 0} occupied</p>
          </div>

          {/* Occupancy Rate Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-500">Occupancy Rate</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.occupancyRate ?? '—'}%</p>
            <p className="text-sm text-green-500 mt-1">↑ 2.1% from last month</p>
          </div>

          {/* Annual NOI Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-500">Annual NOI</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats?.totalAnnualNOI ?? '—'}</p>
            <p className="text-sm text-gray-400 mt-1">Net Operating Income</p>
          </div>

          {/* Average Rent Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                <Activity className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-500">Avg. Rent</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">${stats?.avgRent?.toLocaleString() ?? '—'}</p>
            <p className="text-sm text-orange-500 mt-1">{stats?.highRiskTenants ?? 0} high-risk tenants</p>
          </div>
        </div>

        {/* Interactive AI Models Section */}
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

              fetch('http://localhost:8000/predict/rent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              })
                .then(res => res.json())
                .then(res => setRentResult(res.estimated_rent.toLocaleString()))
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

              fetch('http://localhost:8000/predict/churn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
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
    </div>
  )
}
