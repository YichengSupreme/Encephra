import React from 'react';
import { Search } from 'lucide-react';

interface SearchWidgetProps {
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    searchMode: 'title' | 'tag';
    setSearchMode: (m: 'title' | 'tag') => void;
}

export const SearchWidget: React.FC<SearchWidgetProps> = ({ searchQuery, setSearchQuery, searchMode, setSearchMode }) => {
    return (
        <div className="pointer-events-auto flex justify-center w-full pt-4">
            <div className="relative group w-[90vw] md:w-96">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-cyan-400 transition-colors">
                    <Search className="w-4 h-4" />
                </div>
                <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${searchMode}...`}
                    className="block w-full pl-10 pr-24 py-2.5 bg-black/40 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 backdrop-blur-xl transition-all shadow-lg"
                />
                <div className="absolute inset-y-0 right-2 flex items-center">
                    <button 
                        onClick={() => setSearchMode(searchMode === 'title' ? 'tag' : 'title')}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 transition-all group/toggle"
                        title={`Switch to ${searchMode === 'title' ? 'Tag' : 'Title'} search`}
                    >
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${searchMode === 'title' ? 'text-cyan-400' : 'text-slate-500'}`}>Title</span>
                        <span className="text-slate-700">/</span>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${searchMode === 'tag' ? 'text-cyan-400' : 'text-slate-500'}`}>Tag</span>
                    </button>
                </div>
            </div>
        </div>
    );
};