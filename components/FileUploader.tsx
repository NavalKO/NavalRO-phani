import React, { useCallback } from 'react';
import { Upload, FileText, CheckCircle, X } from 'lucide-react';

interface FileUploaderProps {
  label: string;
  description: string;
  accept?: string;
  onFileLoaded: (content: string) => void;
  onClear: () => void;
  hasFile: boolean;
  fileName?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  label,
  description,
  accept = ".json,.txt,.md",
  onFileLoaded,
  onClear,
  hasFile,
  fileName
}) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      onFileLoaded(text);
    };
    reader.readAsText(file);
  }, [onFileLoaded]);

  if (hasFile) {
    return (
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 flex items-center justify-between group transition-all">
        <div className="flex items-center gap-3">
          <div className="bg-green-500/20 p-2 rounded-full">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h4 className="font-medium text-green-100">{label}</h4>
            <p className="text-xs text-green-400/70 truncate max-w-[200px]">{fileName || 'File loaded'}</p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="p-2 hover:bg-red-500/20 rounded-full text-gray-400 hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="border-2 border-dashed border-gray-700 bg-gray-900/50 hover:bg-gray-800/50 hover:border-indigo-500/50 rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all duration-200 h-full">
        <div className="bg-gray-800 p-3 rounded-full mb-3">
          <Upload className="w-6 h-6 text-indigo-400" />
        </div>
        <h4 className="font-medium text-gray-200 mb-1">{label}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );
};