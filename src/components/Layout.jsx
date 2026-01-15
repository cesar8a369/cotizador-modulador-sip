import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { PenTool, Calculator, Users, FileText, Settings, Download, Mail, Check } from 'lucide-react';
import { PROJECT_LOGO } from '../data/constants';
import clsx from 'clsx';

const NavItem = ({ to, icon: Icon, label, active }) => (
    <Link
        to={to}
        className={clsx(
            "flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 rounded-xl transition-all duration-200 whitespace-nowrap",
            active
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
        )}
    >
        <Icon size={16} className="md:w-[18px] md:h-[18px]" />
        <span className="text-xs md:text-sm font-medium tracking-wide">{label}</span>
    </Link>
);

const Layout = () => {
    const location = useLocation();
    const currentPath = location.pathname;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 shadow-2xl print:hidden">
                <div className="max-w-[1920px] mx-auto px-4 md:px-6 min-h-[4rem] flex flex-col md:flex-row items-center justify-between py-3 md:py-0 gap-4">

                    {/* Logo Area */}
                    <div className="flex items-center gap-4 self-start md:self-auto group">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                            <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg border border-slate-700/50 overflow-hidden p-1">
                                <img src={PROJECT_LOGO} alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-white font-black text-xs md:text-sm lg:text-base tracking-[0.2em] uppercase leading-none">
                                MODULADOR <span className="text-cyan-400">SIP</span>
                            </h1>
                            <span className="text-[8px] md:text-[10px] text-slate-500 font-bold uppercase tracking-[0.1em] mt-1">
                                LA FÁBRICA DEL PANEL
                            </span>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="w-full md:w-auto flex items-center gap-1 bg-slate-950/50 p-1 rounded-2xl border border-slate-800/50 backdrop-blur-sm overflow-x-auto no-scrollbar scroll-smooth">
                        <NavItem to="/engineering" icon={PenTool} label="Ingeniería" active={currentPath.includes('engineering')} />
                        <NavItem to="/budget" icon={Calculator} label="Presupuesto" active={currentPath.includes('budget')} />
                        <NavItem to="/crm" icon={Users} label="CRM" active={currentPath.includes('crm')} />
                        <NavItem to="/admin" icon={Settings} label="Admin" active={currentPath.includes('admin')} />
                        <NavItem to="/export" icon={Download} label="Exportar" active={currentPath.includes('export')} />
                    </nav>

                    {/* User/Action placeholder */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-slate-400 text-xs uppercase tracking-wider">Usuario</p>
                            <p className="text-white text-sm font-semibold">Ingeniero Senior</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                            <Users size={20} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-2 md:p-6 max-w-[1920px] mx-auto w-full overflow-x-hidden">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="bg-slate-900 border-t border-slate-800 py-4 print:hidden">
                <div className="max-w-[1920px] mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-500 rounded flex items-center justify-center">
                                <Check size={16} className="text-white font-bold" strokeWidth={3} />
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold">Desarrollado por <span className="text-cyan-400">ResolvIA</span></p>
                                <p className="text-slate-400 text-xs">Soluciones potenciadas con Inteligencia Artificial</p>
                            </div>
                        </div>
                        <a href="mailto:consultora.resolvia@gmail.com" className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors">
                            <Mail size={16} />
                            <span className="text-sm">consultora.resolvia@gmail.com</span>
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
