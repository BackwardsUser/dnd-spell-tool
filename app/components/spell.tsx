"use client";

import { useState } from "react";
import { DropdownIcon } from "./dropdown";

export default function Spell({
  name,
  content,
  onRemove
}: {
  name: string,
  content: string[],
  onRemove: () => void
}) {
  const [shown, setShown] = useState(false);

  const getLevelColor = (spellName: string) => {
    if (spellName.toLowerCase().includes('cantrip')) return 'bg-emerald-900/50 text-emerald-300 border-emerald-700/50';
    const match = spellName.match(/\[(\d+)(?:st|nd|rd|th)\]/);
    if (match) {
      const level = parseInt(match[1]);
      const colors = [
        'bg-slate-700 text-slate-300 border-slate-600',
        'bg-blue-900/50 text-blue-300 border-blue-700/50',
        'bg-indigo-900/50 text-indigo-300 border-indigo-700/50',
        'bg-purple-900/50 text-purple-300 border-purple-700/50',
        'bg-pink-900/50 text-pink-300 border-pink-700/50',
        'bg-red-900/50 text-red-300 border-red-700/50',
        'bg-orange-900/50 text-orange-300 border-orange-700/50',
        'bg-yellow-900/50 text-yellow-300 border-yellow-700/50',
        'bg-green-900/50 text-green-300 border-green-700/50',
        'bg-teal-900/50 text-teal-300 border-teal-700/50'
      ];
      return colors[level % colors.length];
    }
    return 'bg-slate-700 text-slate-300 border-slate-600';
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div className="break-inside-avoid">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl hover:shadow-2xl transition-shadow duration-200 overflow-hidden">
        <button
          onClick={() => setShown(!shown)}
          className="w-full cursor-pointer flex items-center justify-between px-4 py-3 hover:bg-slate-700/50 transition-colors duration-200"
          aria-expanded={shown}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <span className={`text-xs font-bold px-2.5 py-1 rounded border ${getLevelColor(name)} whitespace-nowrap`}>
              {name.match(/\[([^\]]+)\]/)?.[1] || 'Spell'}
            </span>
            <h3 className="text-base font-medium text-white truncate">
              {name.replace(/\[[^\]]+\]\s*/, '')}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <button
              onClick={handleRemove}
              className="text-slate-500 hover:text-red-400 transition-colors duration-200 p-1 rounded hover:bg-slate-700"
              aria-label="Remove spell"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <div className={`transform transition-transform duration-300 ${shown ? 'rotate-180' : ''}`}>
              <DropdownIcon />
            </div>
          </div>
        </button>

        {/* This version uses absolute positioning within a relative container to prevent layout shift */}
        <div className="relative">
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${shown ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="px-4 pb-4 pt-1 border-t border-slate-700/50">
              <div className="bg-slate-900/50 rounded-lg px-4 py-3 text-slate-300 leading-relaxed text-sm border border-slate-700/30">
                {content.map((cont, i) => (
                  <p key={i} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{ __html: cont.replaceAll("\n", "<br/>") }}></p>
                ))}
              </div>
            </div>
          </div>
          {/* This invisible spacer maintains the card height when collapsed */}
          <div
            className="pointer-events-none"
            style={{
              height: shown ? '0' : '0px',
              opacity: 0
            }}
          />
        </div>
      </div>
    </div>
  );
}