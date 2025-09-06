import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: "html" | "css" | "javascript";
  placeholder?: string;
}

export default function CodeEditor({ value, onChange, language, placeholder }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.target as HTMLTextAreaElement;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        textarea.setSelectionRange(start + 2, start + 2);
      });
    }
  };

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    switch (language) {
      case 'html':
        return '<!-- Write your HTML here -->';
      case 'css':
        return '/* Write your CSS here */';
      case 'javascript':
        return '// Write your JavaScript here';
      default:
        return '';
    }
  };

  return (
    <div className="flex-1 min-h-0 p-2">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={getPlaceholder()}
        className={`w-full h-full resize-none font-mono text-sm border-0 bg-transparent focus:ring-0 focus:outline-none syntax-${language} min-h-full`}
        data-testid={`editor-${language}`}
        style={{ minHeight: 'calc(100vh - 200px)' }}
      />
    </div>
  );
}
