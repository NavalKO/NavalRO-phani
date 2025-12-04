import React from 'react';
import { Copy, Check } from 'lucide-react';

interface JsonDisplayProps {
  data: string;
}

export const JsonDisplay: React.FC<JsonDisplayProps> = ({ data }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(data);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let formattedJson = data;
  try {
    const obj = JSON.parse(data);
    formattedJson = JSON.stringify(obj, null, 2);
  } catch (e) {
    // If it's not valid JSON, display as is
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-700 bg-[#0d1117]">
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={handleCopy}
          className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg shadow-lg border border-gray-600 transition-colors flex items-center gap-2 text-xs font-medium"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy JSON</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-gray-300 overflow-auto max-h-[600px] scrollbar-thin">
        <code>{formattedJson}</code>
      </pre>
    </div>
  );
};