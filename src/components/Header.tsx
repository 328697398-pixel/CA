import React from 'react';
import { LogOut, User } from 'lucide-react';

interface HeaderProps {
  username?: string;
}

export default function Header({ username = '159****9560' }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 h-16 px-6 flex items-center justify-between shrink-0 select-none shadow-xs">
      <div className="flex items-center gap-3">
        {/* CA Logo */}
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm tracking-wider shadow-sm">
          CA
        </div>
        <span className="font-bold text-slate-900 text-base tracking-tight">西恩贝销售管理系统</span>
      </div>
      
      <div className="flex items-center gap-4 text-sm font-medium">
        <div className="flex items-center gap-1.5 text-slate-600">
          <User className="w-4 h-4 text-slate-400" />
          <span>{username}</span>
        </div>
        <span className="text-slate-200">|</span>
        <button className="flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors cursor-pointer">
          <LogOut className="w-4 h-4" />
          <span>退出</span>
        </button>
      </div>
    </header>
  );
}
