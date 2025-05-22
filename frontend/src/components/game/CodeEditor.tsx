'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Editor, Monaco, OnMount } from '@monaco-editor/react';
import { ProgrammingLanguage } from '@/types/challenges';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Spinner } from '@/components/ui/spinner';

interface CodeEditorProps {
  /**
   * Initial code content
   */
  initialValue: string;
  
  /**
   * Programming language for syntax highlighting
   */
  language: ProgrammingLanguage;
  
  /**
   * Callback when code changes
   */
  onChange?: (value: string) => void;
  
  /**
   * Callback when code is submitted
   */
  onSubmit?: (value: string) => void;
  
  /**
   * Whether the editor is read-only
   */
  readOnly?: boolean;
  
  /**
   * Height of the editor (default: 400px)
   */
  height?: string | number;
  
  /**
   * Theme override
   */
  theme?: 'vs-dark' | 'light';
  
  /**
   * Editor's font size (default: 14)
   */
  fontSize?: number;
  
  /**
   * Additional CSS class for the container
   */
  className?: string;
  
  /**
   * Show line numbers (default: true)
   */
  showLineNumbers?: boolean;
  
  /**
   * Enable minimap (default: false)
   */
  minimap?: boolean;
  
  /**
   * ID for accessibility/testing
   */
  id?: string;
}

/**
 * Monaco-based code editor component with syntax highlighting and pixel modern theme
 */
const CodeEditor: React.FC<CodeEditorProps> = ({
  initialValue,
  language,
  onChange,
  onSubmit,
  readOnly = false,
  height = 400,
  theme: themeOverride,
  fontSize = 14,
  className,
  showLineNumbers = true,
  minimap = false,
  id = 'code-editor',
}) => {
  const { theme: systemTheme } = useTheme();
  const [editorValue, setEditorValue] = useState(initialValue);
  const [isEditorReady, setIsEditorReady] = useState(false);
  const monacoRef = useRef<Monaco | null>(null);
  const editorRef = useRef<any>(null);
  
  // Determine theme to use (override or system theme)
  const resolvedTheme = themeOverride || (systemTheme === 'dark' ? 'vs-dark' : 'light');
  
  // Define custom theme with pixel modern colors
  const defineCustomTheme = (monaco: Monaco) => {
    monaco.editor.defineTheme('pixel-modern-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '#6A7391' },
        { token: 'keyword', foreground: '#FF6B6B' },
        { token: 'string', foreground: '#2ECC71' },
        { token: 'number', foreground: '#FFA502' },
        { token: 'identifier', foreground: '#45AAF2' }
      ],
      colors: {
        'editor.background': '#2F3542',
        'editor.foreground': '#F1F2F6',
        'editorCursor.foreground': '#4B7BEC',
        'editor.lineHighlightBackground': '#3A3F4D',
        'editorLineNumber.foreground': '#4B7BEC80',
        'editor.selectionBackground': '#4B7BEC40',
        'editor.selectionHighlightBackground': '#4B7BEC20',
      }
    });
    
    monaco.editor.defineTheme('pixel-modern-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '#7C8297' },
        { token: 'keyword', foreground: '#D63031' },
        { token: 'string', foreground: '#009432' },
        { token: 'number', foreground: '#E67E22' },
        { token: 'identifier', foreground: '#0984E3' }
      ],
      colors: {
        'editor.background': '#F1F2F6',
        'editor.foreground': '#2F3542',
        'editorCursor.foreground': '#4B7BEC',
        'editor.lineHighlightBackground': '#E5E7EB',
        'editorLineNumber.foreground': '#4B7BEC80',
        'editor.selectionBackground': '#4B7BEC40',
        'editor.selectionHighlightBackground': '#4B7BEC20',
      }
    });
  };
  
  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    defineCustomTheme(monaco);
    
    // Set custom theme based on resolved theme
    editor.updateOptions({
      theme: resolvedTheme === 'vs-dark' ? 'pixel-modern-dark' : 'pixel-modern-light',
    });
    
    // Add keyboard shortcut for submission
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onSubmit) {
        onSubmit(editor.getValue());
      }
    });
    
    setIsEditorReady(true);
  };
  
  // Handle code changes
  const handleEditorChange = (value: string | undefined) => {
    const newValue = value || '';
    setEditorValue(newValue);
    
    if (onChange) {
      onChange(newValue);
    }
  };
  
  // Update options when dependencies change
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        fontSize,
        minimap: { enabled: minimap },
        lineNumbers: showLineNumbers ? 'on' : 'off',
        readOnly,
        theme: resolvedTheme === 'vs-dark' ? 'pixel-modern-dark' : 'pixel-modern-light',
      });
    }
  }, [fontSize, minimap, showLineNumbers, readOnly, resolvedTheme]);
  
  // Update value when initialValue changes
  useEffect(() => {
    if (editorRef.current && initialValue !== editorValue) {
      // Only update if the current model value is different from initialValue
      if (editorRef.current.getValue() !== initialValue) {
        editorRef.current.setValue(initialValue);
        setEditorValue(initialValue);
      }
    }
  }, [initialValue]);
  
  // Map ProgrammingLanguage to Monaco language ID
  const getMonacoLanguage = (lang: ProgrammingLanguage): string => {
    const languageMap: Record<ProgrammingLanguage, string> = {
      javascript: 'javascript',
      typescript: 'typescript',
      python: 'python',
      java: 'java',
      c: 'c',
      cpp: 'cpp',
    };
    
    return languageMap[lang] || 'plaintext';
  };
  
  return (
    <div 
      className={cn(
        'code-editor-container rounded-lg overflow-hidden border-2 border-pixel',
        'transition-all duration-200',
        resolvedTheme === 'vs-dark' ? 'border-dark-600' : 'border-gray-300',
        className
      )}
      data-testid={id}
    >
      <div className="code-editor-header flex items-center px-3 py-2 bg-dark-700 text-white">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-danger"></div>
          <div className="w-3 h-3 rounded-full bg-warning"></div>
          <div className="w-3 h-3 rounded-full bg-accent"></div>
        </div>
        <div className="ml-4 text-xs font-medium">
          {language.toUpperCase()}
        </div>
        {!isEditorReady && (
          <div className="ml-auto">
            <Spinner size="sm" />
          </div>
        )}
        <div className="ml-auto text-xs opacity-70">
          Ctrl+Enter to submit
        </div>
      </div>
      
      <Editor
        height={height}
        language={getMonacoLanguage(language)}
        value={initialValue}
        theme={resolvedTheme === 'vs-dark' ? 'pixel-modern-dark' : 'pixel-modern-light'}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        loading={<Spinner className="mt-8" />}
        options={{
          fontSize,
          minimap: { enabled: minimap },
          lineNumbers: showLineNumbers ? 'on' : 'off',
          readOnly,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          formatOnPaste: true,
          formatOnType: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          folding: true,
          glyphMargin: false,
          renderLineHighlight: 'line',
          fontFamily: "'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
          fontLigatures: true,
        }}
      />
      
      {onSubmit && (
        <div className="code-editor-footer px-3 py-2 bg-dark-700 text-white">
          <button
            onClick={() => onSubmit(editorValue)}
            className="px-4 py-1 bg-primary hover:bg-primary/80 transition-colors rounded font-pixel text-xs text-white"
            disabled={!isEditorReady || readOnly}
          >
            Submit Solution
          </button>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
