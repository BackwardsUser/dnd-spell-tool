"use client";

import { useState, useEffect } from "react";
import Adder from "./components/adder";
import Spell from "./components/spell";

// Helper function to extract level from spell name
function extractLevelFromName(name: string): number {
  // Check for Cantrip
  if (name.toLowerCase().includes('cantrip')) {
    return 0;
  }

  // Check for level like "1st", "2nd", "3rd", etc.
  const levelMatch = name.match(/(\d+)(?:st|nd|rd|th)/);
  if (levelMatch) {
    return parseInt(levelMatch[1]);
  }

  // Default to a high number if no level found
  return 999;
}

// Sort spells by level (Cantrip first, then 1st, 2nd, etc.)
function sortSpellsByLevel(spells: { name: string; content: string[] }[]) {
  return [...spells].sort((a, b) => {
    const levelA = extractLevelFromName(a.name);
    const levelB = extractLevelFromName(b.name);
    return levelA - levelB;
  });
}

export default function Home() {
  // Use lazy initialization to load from localStorage once
  const [spells, setSpells] = useState<{
    name: string;
    content: string[];
  }[]>(() => {
    try {
      const savedSpells = localStorage.getItem("spells");
      return savedSpells ? JSON.parse(savedSpells) : [];
    } catch (error) {
      console.error("Failed to parse spells from localStorage:", error);
      return [];
    }
  });

  // Save spells to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("spells", JSON.stringify(spells));
  }, [spells]);

  const addSpell = (name: string, content: string[]) => {
    setSpells([...spells, { name, content }]);
  };

  const removeSpell = (index: number) => {
    setSpells(spells.filter((_, i) => i !== index));
  };

  // Sort spells by level
  const sortedSpells = sortSpellsByLevel(spells);

  // Distribute spells into columns for independent column rendering
  const distributeSpellsIntoColumns = (spells: { name: string; content: string[] }[], numColumns: number) => {
    const columns: { name: string; content: string[] }[][] = Array.from({ length: numColumns }, () => []);
    spells.forEach((spell, index) => {
      columns[index % numColumns].push(spell);
    });
    return columns;
  };

  // Get number of columns based on screen size
  const getNumColumns = () => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  const [numColumns, setNumColumns] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setNumColumns(getNumColumns());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const columns = distributeSpellsIntoColumns(sortedSpells, numColumns);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-start pt-8 flex-col">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white tracking-tight">
            📖 Spellbook
          </h1>
          <p className="text-slate-400 mt-2 text-lg">Manage your D&D 5e spells</p>
        </header>

        <div className="flex justify-center mb-8">
          <Adder onAddSpell={addSpell} />
        </div>

        <div
          id="main"
          className={`transition-all duration-300 ease-in-out ${spells.length === 0 ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
        >
          {spells.length > 0 && (
            <div className="bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-sm p-6">
              {/* Independent columns using CSS grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {columns.map((column, colIndex) => (
                  <div key={colIndex} className="flex flex-col gap-6">
                    {column.map((spell, i) => (
                      <Spell
                        key={i}
                        name={spell.name}
                        content={spell.content}
                        onRemove={() => {
                          const originalIndex = spells.indexOf(spell);
                          removeSpell(originalIndex);
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {spells.length === 0 && (
            <div className="text-center py-16 bg-slate-800/50 rounded-2xl shadow-2xl border border-slate-700/60 backdrop-blur-sm">
              <div className="text-6xl mb-4">✨</div>
              <p className="text-slate-400 text-lg">No spells yet. Add your first spell above!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}