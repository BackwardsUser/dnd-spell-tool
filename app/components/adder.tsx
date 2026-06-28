"use client";

import { useState } from "react";
import axios, { AxiosResponse } from "axios";

interface AdderProps {
  onAddSpell: (name: string, content: string[]) => void;
}

function trimArray(arr: string[]) {
  let start = 0;
  while (start < arr.length && arr[start].trim() === '') {
    start++;
  }

  let end = arr.length - 1;
  while (end >= 0 && arr[end].trim() === '') {
    end--;
  }

  return arr.slice(start, end + 1);
}

// Extract spell level from content
function extractLevel(content: string[]): string {
  for (const line of content) {
    // Look for "Level: X" or "X-level" patterns
    const levelMatch = line.match(/Level:\s*(\d+)(?:st|nd|rd|th)?\s*level/i);
    if (levelMatch) {
      const level = parseInt(levelMatch[1]);
      // Convert to ordinal
      const ordinals = ['th', 'st', 'nd', 'rd'];
      const ordinal = level <= 3 ? ordinals[level] : 'th';
      return `${level}${ordinal}`;
    }

    // Alternative format: "X-level"
    const altMatch = line.match(/(\d+)(?:st|nd|rd|th)?-level/i);
    if (altMatch) {
      const level = parseInt(altMatch[1]);
      const ordinals = ['th', 'st', 'nd', 'rd'];
      const ordinal = level <= 3 ? ordinals[level] : 'th';
      return `${level}${ordinal}`;
    }

    // Cantrip detection
    if (line.match(/cantrip/i)) {
      return 'Cantrip';
    }
  }
  return '';
}

// Extract range from content
function extractRange(content: string[]): string {
  for (const line of content) {
    // Look for range pattern
    const rangeMatch = line.match(/Range:\s*([^,\n]+)/i);
    if (rangeMatch) {
      return rangeMatch[1].trim();
    }
  }
  return '';
}

// Extract damage from content
function extractDamage(content: string[]): string {
  for (const line of content) {
    // Look for damage patterns
    const damageMatch = line.match(/Damage\/Effect:\s*([^,\n]+)/i);
    if (damageMatch) {
      return damageMatch[1].trim();
    }

    // Alternative: look for damage dice patterns
    const diceMatch = line.match(/(\d+d\d+|\d+d\d+\s*\+\s*\d+)\s+(?:[a-z]+)\s+damage/i);
    if (diceMatch) {
      return diceMatch[1];
    }
  }
  return '';
}

// Capitalize first letter of each word in spell name
function formatSpellName(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function Adder({ onAddSpell }: AdderProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!name.trim()) {
      setError("Please enter a spell name.");
      setLoading(false);
      return;
    }

    const searchTerm = name.trim().toLowerCase().replaceAll(" ", "-");
    const searchUrl = `https://dnd5e.wikidot.com/spell:${searchTerm}`;
    const proxiedUrl = `https://corsproxy.backwards.dev/?url="${encodeURIComponent(searchUrl)}"`;

    console.log("Searching for:", searchUrl);

    try {
      const res = await axios.get(proxiedUrl, {
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      console.log("Response status:", res.status);
      console.log("Response data length:", res.data?.length);

      if (res.status === 404) {
        setError("Spell not found. Please check the spelling.");
        setLoading(false);
        return;
      }

      if (res.status >= 500) {
        setError("Failed to get upstream data. Try again later.");
        setLoading(false);
        return;
      }

      if (!res.data || typeof res.data !== 'string') {
        setError("Invalid response from server.");
        setLoading(false);
        return;
      }

      const parser = new DOMParser();
      const doc = parser.parseFromString(res.data, "text/html");
      const div = doc.getElementById("page-content");

      if (!div) {
        setError("Failed to parse spell data.");
        setLoading(false);
        return;
      }

      let hasCastingTime = false;
      const lines: string[] = [];

      div.childNodes.forEach(child => {
        const text = child.textContent?.trim();

        if (text && text.includes("Casting Time")) {
          hasCastingTime = true;
        }

        if (text && text.length > 0) {
          lines.push(text);
        }
      });

      if (!hasCastingTime) {
        setError("Spell not found or invalid spell data.");
        setLoading(false);
        return;
      }

      const cleanedLines = lines
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (cleanedLines.length === 0) {
        setError("No spell data found.");
        setLoading(false);
        return;
      }

      // Extract spell details
      const level = extractLevel(cleanedLines);
      const range = extractRange(cleanedLines);
      const damage = extractDamage(cleanedLines);

      // Format the spell name
      const formattedName = formatSpellName(name.trim());

      // Build the display name
      let displayName = formattedName;
      if (level) {
        displayName = `[${level}] ${displayName}`;
      }
      if (range) {
        displayName = `${displayName} (${range}`;
        if (damage) {
          displayName = `${displayName}, ${damage})`;
        } else {
          displayName = `${displayName})`;
        }
      } else if (damage) {
        displayName = `${displayName} (${damage})`;
      }

      onAddSpell(displayName, cleanedLines);
      setName("");
      setLoading(false);

    } catch (error) {
      // Type guard to check if error is an AxiosError
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          setError("Request timed out. Please try again.");
        } else if (error.response?.status === 404) {
          setError("Spell not found. Please check the spelling.");
        } else if (error.response?.status && error.response.status >= 500) {
          setError("Server error. Try again later.");
        } else {
          setError(error.message || "Failed to find spell.");
        }
      } else if (error instanceof Error) {
        // Handle standard Error objects
        setError(error.message || "Failed to find spell.");
      } else {
        // Fallback for other types of errors
        setError("An unexpected error occurred.");
      }
      console.error("Spell fetch error:", error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex gap-3">
        <input
          type="text"
          className="flex-1 bg-slate-700 border-2 border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all duration-200"
          placeholder="Enter spell name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
        />
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30"
          disabled={loading}
        >
          {loading ? '⏳' : 'Add Spell'}
        </button>
      </div>
      {error && (
        <div className="mt-2 text-red-400 text-sm font-medium bg-red-900/30 px-4 py-2 rounded-lg border border-red-800/50">
          ⚠️ {error}
        </div>
      )}
    </form>
  );
}