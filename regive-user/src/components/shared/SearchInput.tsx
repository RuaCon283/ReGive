'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from 'antd';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  size?: 'small' | 'middle' | 'large';
  debounceMs?: number;
  allowClear?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value: controlledValue,
  onChange,
  onSearch,
  placeholder = 'Tìm kiếm...',
  size = 'large',
  debounceMs = 300,
  allowClear = true,
  className = '',
  autoFocus = false,
}) => {
  const [internalValue, setInternalValue] = useState(controlledValue || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  useEffect(() => {
    if (isControlled) {
      setInternalValue(controlledValue);
    }
  }, [controlledValue, isControlled]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onSearch?.(newValue);
      }, debounceMs);
    },
    [isControlled, onChange, onSearch, debounceMs]
  );

  const handleClear = useCallback(() => {
    if (!isControlled) {
      setInternalValue('');
    }
    onChange?.('');
    onSearch?.('');
  }, [isControlled, onChange, onSearch]);

  const handlePressEnter = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onSearch?.(currentValue);
  }, [currentValue, onSearch]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <Input
      value={currentValue}
      onChange={handleChange}
      onPressEnter={handlePressEnter}
      placeholder={placeholder}
      prefix={<Search className="w-4 h-4 text-gray-400 mr-1" />}
      suffix={
        allowClear && currentValue ? (
          <button
            onClick={handleClear}
            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors border-0 bg-transparent cursor-pointer"
            aria-label="Xoá tìm kiếm"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null
      }
      size={size}
      autoFocus={autoFocus}
      className={`!rounded-xl ${className}`}
    />
  );
};