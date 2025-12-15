"use client"

import { Sun } from 'lucide-react';

export default function LoadingIndicator({ charge }) {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] mb-[40px] bg-gray-300">
      <div className="relative w-48 h-48 rounded-lg shadow-lg bg-white"> {/* Ajout de coins arrondis et d'ombre */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 gap-1">
          {[...Array(9)].map((_, index) => (
            <div
              key={index}
              className="bg-blue-200 rounded-sm transition-colors duration-300 ease-in-out"
              style={{
                backgroundColor: charge > index * 11 ? '#3b82f6' : '#bfdbfe',
              }}
            />
          ))}
        </div>
        <Sun
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-yellow-400 animate-pulse"
          size={64}
        />
      </div>
      <div className="mt-4 text-lg font-semibold text-gray-700">
      Chargement... {charge}%
      </div>
    </div>
  );
}