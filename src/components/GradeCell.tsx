import { useState, useRef, useEffect } from 'react';
import { formatGrade, parseGrade, isValidGrade } from '../utils/gradeCalculations';

interface GradeCellProps {
  value: number | null;
  onChange: (value: number | null) => void;
  readOnly?: boolean;
  isAverage?: boolean;
  formatter?: (value: number | null) => string;
}

export function GradeCell({ value, onChange, readOnly = false, isAverage = false, formatter = formatGrade }: GradeCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    if (readOnly) return;
    setIsEditing(true);
    setInputValue(value !== null ? value.toString().replace('.', ',') : '');
  };

  const handleBlur = () => {
    if (isValidGrade(inputValue)) {
      onChange(parseGrade(inputValue));
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    } else if (e.key === 'Tab') {
      handleBlur();
    }
  };

  const getGradeColor = (grade: number | null): string => {
    if (grade === null) return '';
    if (grade <= 2) return 'text-green-600';
    if (grade <= 3) return 'text-yellow-600';
    if (grade <= 4) return 'text-orange-500';
    return 'text-red-500';
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`w-full h-full px-2 py-1 text-center border-2 border-blue-500 outline-none ${
          !isValidGrade(inputValue) ? 'bg-red-100' : ''
        }`}
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`w-full h-full px-2 py-1 text-center cursor-${readOnly ? 'default' : 'pointer'} ${
        isAverage ? 'font-semibold bg-gray-50' : ''
      } ${getGradeColor(value)} hover:bg-blue-50`}
    >
      {formatter(value)}
    </div>
  );
}
