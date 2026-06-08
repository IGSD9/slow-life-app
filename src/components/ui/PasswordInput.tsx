"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
}

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  minLength,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="w-full px-3 py-2 pr-10 rounded-lg bg-[#1a1a2e] border border-[#e94560]/20 text-white focus:border-[#e94560] outline-none"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-200 transition-colors"
        aria-label={visible ? "パスワードを隠す" : "パスワードを表示"}
      >
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
