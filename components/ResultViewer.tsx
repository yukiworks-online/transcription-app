import React from "react";
import { FileText, Copy, Download } from "lucide-react";

interface ResultViewerProps {
    title: string;
    content: string;
}

export function ResultViewer({ title, content }: ResultViewerProps) {
    const handleCopy = () => {
        navigator.clipboard.writeText(content);
        // Could add toast notification here
    };

    const handleDownload = () => {
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title.toLowerCase().replace(/\s+/g, "_")}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleCopy}
                        className="p-2 hover:bg-white rounded-lg hover:shadow-sm text-slate-500 hover:text-slate-700 transition-all border border-transparent hover:border-slate-200"
                        title="Copy to clipboard"
                    >
                        <Copy className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleDownload}
                        className="p-2 hover:bg-white rounded-lg hover:shadow-sm text-slate-500 hover:text-slate-700 transition-all border border-transparent hover:border-slate-200"
                        title="Download Markdown"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-auto p-8 font-mono text-sm leading-relaxed text-slate-700 whitespace-pre-wrap bg-white">
                {content}
            </div>
        </div>
    );
}
