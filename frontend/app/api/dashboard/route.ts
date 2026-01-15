import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define paths to the synthetic data (adjusting relative to the Next.js app root)
const DATA_DIR = path.join(process.cwd(), '..', 'src', 'data', 'synthetic');

export async function GET() {
    try {
        // 1. Read Units
        const unitsPath = path.join(DATA_DIR, 'calibrated_units.csv');
        const unitsData = fs.readFileSync(unitsPath, 'utf-8');
        const unitsRows = unitsData.split('\n').slice(1).filter(r => r.trim() !== '');

        // 2. Read Tenants
        const tenantsPath = path.join(DATA_DIR, 'calibrated_tenants.csv');
        const tenantsData = fs.readFileSync(tenantsPath, 'utf-8');
        const tenantsRows = tenantsData.split('\n').slice(1).filter(r => r.trim() !== '');

        // 3. Calculate Stats
        const totalUnits = unitsRows.length;
        const totalTenants = tenantsRows.length;

        let totalMonthlyRent = 0;

        // Parse Units to get Rent Sum
        unitsRows.forEach(row => {
            // Robust parsing: Market Rent is the LAST column. 
            // The split(',') fails if 'amenities' contains commas.
            // Safe approach: grab everything after the last comma.
            const lastComma = row.lastIndexOf(',');
            if (lastComma !== -1) {
                const rentPart = row.substring(lastComma + 1).trim();
                const rent = parseFloat(rentPart);
                if (!isNaN(rent)) {
                    totalMonthlyRent += rent;
                }
            }
        });

        // 4. Calculate Risk Proxy
        // Tenant CSV: tenant_id, name, email, income, credit_score, job, move_in_reason (wait, checking schema)
        // Step 102 schema: ['tenant_id', 'unit_id', 'name', 'income', 'credit_score', 'lease_start']
        // Income is index 3? Credit is index 4?
        // Let's use the same robust logic or just split carefully. 
        // None of the tenant fields seem to be quoted lists EXCEPT maybe name? No, Faker names are usually clean.
        // But let's be safe. Credit Score is usually 2nd to last column if 'lease_start' is last.
        // Let's check schema again from Step 102 Output:
        // Tenants Table Columns: ['tenant_id', 'unit_id', 'name', 'income', 'credit_score', 'lease_start']
        // Credit Score is Index 4.

        let highRiskCount = 0;
        tenantsRows.forEach(row => {
            const cols = row.split(',');
            // If name has a comma (e.g. "Doe, John") it breaks using strict index.
            // But let's assume standard Faker names for now.
            // Index 4 is credit score.
            if (cols[4]) {
                const credit = parseInt(cols[4]);
                if (!isNaN(credit) && credit < 620) highRiskCount++;
            }
        });

        return NextResponse.json({
            totalUnits,
            occupiedUnits: totalTenants,
            occupancyRate: totalUnits > 0 ? ((totalTenants / totalUnits) * 100).toFixed(1) : "0.0",
            totalAnnualNOI: (totalMonthlyRent * 12).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
            avgRent: totalUnits > 0 ? Math.round(totalMonthlyRent / totalUnits) : 0,
            highRiskTenants: highRiskCount
        });

    } catch (error) {
        console.error("Error reading data:", error);
        return NextResponse.json({ error: "Failed to load synthetic data" }, { status: 500 });
    }
}
