"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Search, Users, PieChart, Settings, LogOut, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/' },
    { icon: Search, label: 'Market Search', href: '/search' },
    { icon: Users, label: 'Tenants & Risk', href: '/tenants' },
    { icon: Building2, label: 'Properties', href: '/properties' },
    { icon: PieChart, label: 'Analytics', href: '/analytics' },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="fixed left-4 top-4 bottom-4 w-20 lg:w-64 bg-sidebar rounded-3xl flex flex-col items-center lg:items-start py-8 transition-all duration-300 shadow-2xl z-50 overflow-hidden">
            {/* Logo */}
            <div className="flex items-center gap-3 px-0 lg:px-8 mb-12">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white font-bold text-xl">A</span>
                </div>
                <span className="text-white font-bold text-lg hidden lg:block opacity-90">ASA Real Estate</span>
            </div>

            {/* Menu */}
            <nav className="flex-1 w-full flex flex-col gap-4 px-3 lg:px-6">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group flex items-center gap-4 px-3 py-3 rounded-2xl transition-all duration-200",
                                isActive
                                    ? "bg-white text-sidebar shadow-lg transform translate-x-1 scale-105"
                                    : "text-sidebar-foreground hover:bg-white/10 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("w-6 h-6", isActive ? "text-sidebar" : "group-hover:text-white")} />
                            <span className={cn("font-medium hidden lg:block", isActive ? "font-bold" : "")}>{item.label}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Actions */}
            <div className="w-full px-3 lg:px-6 mt-auto">
                <button className="w-full flex items-center gap-4 px-3 py-3 rounded-2xl text-sidebar-foreground hover:bg-white/10 hover:text-white transition-all">
                    <Settings className="w-6 h-6" />
                    <span className="font-medium hidden lg:block">Settings</span>
                </button>
            </div>
        </aside>
    )
}
