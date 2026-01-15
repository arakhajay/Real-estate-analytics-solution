import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '..', 'src', 'data', 'synthetic');

// Helper to determine risk locally for speed (mimicking the XGBoost logic for the list view)
// In a real app, this would be a batch call to the Python API or a pre-computed column in DB.
function calculateRiskFactor(rent: number, income: number, credit: number) {
    const monthlyIncome = income / 12;
    const burden = rent / monthlyIncome;

    let riskScore = 0;
    if (burden > 0.4) riskScore += 3;
    if (credit < 620) riskScore += 2;

    if (riskScore >= 3) return { level: 'High', reason: 'High Rent Burden (>40%)' };
    if (riskScore >= 2) return { level: 'Medium', reason: 'Low Credit Score' };
    return { level: 'Low', reason: 'Stable Financials' };
}

export async function GET() {
    try {
        // 1. Read Tenants
        const tenantsPath = path.join(DATA_DIR, 'calibrated_tenants.csv');
        const tenantsData = fs.readFileSync(tenantsPath, 'utf-8');
        const rows = tenantsData.split('\n').slice(1).filter(r => r.trim() !== '');

        // 2. Read Units (to get Rent)
        const unitsPath = path.join(DATA_DIR, 'calibrated_units.csv');
        const unitsData = fs.readFileSync(unitsPath, 'utf-8');
        const unitRows = unitsData.split('\n').slice(1).filter(r => r.trim() !== '');

        // Map Unit ID -> Rent
        const unitRentMap = new Map<string, number>();
        unitRows.forEach(row => {
            // unit_id, property_id, type, amenities, sqft, market_rent
            // using robust parsing again
            const lastComma = row.lastIndexOf(',');
            const firstComma = row.indexOf(','); // unit_id is start to first comma
            if (lastComma !== -1 && firstComma !== -1) {
                const u_id = row.substring(0, firstComma);
                const rent = parseFloat(row.substring(lastComma + 1));
                unitRentMap.set(u_id, rent);
            }
        });

        // 3. Process Tenants
        // Schema: tenant_id,unit_id,name,income,credit_score,lease_start
        const tenants = rows.map(row => {
            const cols = row.split(',');
            if (cols.length < 6) return null;

            const t_id = cols[0];
            const u_id = cols[1];
            const name = cols[2];
            const income = parseInt(cols[3]);
            const credit = parseInt(cols[4]);
            const lease_start = cols[5]?.trim();

            const rent = unitRentMap.get(u_id) || 0;

            // Calculate Risk
            const risk = calculateRiskFactor(rent, income, credit);

            // Simulate Sentiment (Random for demo durability)
            const sentiment = Math.random() > 0.8 ? 'Unhappy' : Math.random() > 0.3 ? 'Happy' : 'Neutral';

            return {
                id: t_id,
                name,
                unit: u_id,
                rent,
                income,
                credit,
                leaseEnd: '2026-06-30', // Placeholder as we only have start date, assuming 1y leases
                riskLevel: risk.level,
                riskReason: risk.reason,
                sentiment
            };
        }).filter(t => t !== null);

        return NextResponse.json(tenants);

    } catch (error) {
        console.error("Tenants API Error:", error);
        return NextResponse.json({ error: "Failed to load tenants" }, { status: 500 });
    }
}
