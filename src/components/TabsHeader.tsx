import React from 'react';
import { X } from 'lucide-react';
import { Tab } from '../types';

interface TabsHeaderProps {
  openTabs: Tab[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string, event: React.MouseEvent) => void;
}

export default function TabsHeader({ openTabs, activeTab, onSelectTab, onCloseTab }: TabsHeaderProps) {
  if (openTabs.length === 0) return null;

  return (
    <div className="bg-slate-50 px-5 pt-3 flex items-end gap-1 border-b border-slate-200 shrink-0 select-none overflow-x-auto scrollbar-none h-[42px]">
      {openTabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`group relative flex items-center gap-2 px-4 py-1.5 text-xs font-medium rounded-t-lg border-t border-x cursor-pointer transition-all duration-150 -mb-[1px] ${
              isActive
                ? 'bg-white text-blue-600 border-slate-200 border-b-white shadow-xs z-10 font-semibold'
                : 'bg-slate-100/60 text-slate-500 border-transparent hover:bg-slate-100/90 hover:text-slate-800'
            }`}
          >
            <span>{tab.title}</span>
            
            {/* Close button */}
            {tab.id !== 'home' && (
              <button
                onClick={(e) => onCloseTab(tab.id, e)}
                className={`p-0.5 rounded-full transition-colors ${
                  isActive
                    ? 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
                    : 'hover:bg-slate-200/50 text-slate-400 hover:text-slate-600'
                }`}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
