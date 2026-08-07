import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SelectOption {
  id: string;
  label: string;
  icon?: string;
}

interface CustomSelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  buttonClassName?: string;
  placeholder?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  className = '',
  buttonClassName = '',
  placeholder = '選択してください',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-2xl border border-[#ded5e8] bg-[#f8f5f0]/80 hover:bg-[#f3eff8] text-xs font-bold text-[#3d3546] transition-all cursor-pointer shadow-2xs w-full ${buttonClassName}`}
      >
        <span className="truncate flex items-center gap-1.5">
          {selectedOption?.icon && <span>{selectedOption.icon}</span>}
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#9880be] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 left-0 sm:left-auto sm:right-0 mt-1.5 z-40 bg-white border border-[#ded5e8] rounded-2xl shadow-xl p-1.5 min-w-[160px] max-w-xs space-y-0.5 animate-fade-in max-h-60 overflow-y-auto">
            {options.map((opt) => {
              const isSelected = opt.id === value;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#f3eff8] text-[#9880be] font-bold'
                      : 'text-[#3d3546] hover:bg-[#f8f5f0]'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {opt.icon && <span>{opt.icon}</span>}
                    <span className="truncate">{opt.label}</span>
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#9880be] shrink-0" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
