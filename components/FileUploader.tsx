"use client";

import React, { useState, useCallback } from "react";
import { Upload, FileAudio, X } from "lucide-react";
import { cn } from "@/utils/cn";

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    disabled?: boolean;
}

export function FileUploader({ onFileSelect, disabled }: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (disabled) return;
        setIsDragging(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateAndSetFile = useCallback((file: File) => {
        if (!file.type.startsWith("audio/")) {
            setError("Please upload an audio file (MP3, WAV, M4A, etc.)");
            return;
        }
        setError(null);
        setSelectedFile(file);
        onFileSelect(file);
    }, [onFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, [disabled, validateAndSetFile]);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    }, [validateAndSetFile]);

    const clearFile = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedFile(null);
    }, []);

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !disabled && document.getElementById("file-upload")?.click()}
                className={cn(
                    "relative group cursor-pointer overflow-hidden rounded-3xl border-2 border-dashed transition-all duration-300 ease-out",
                    isDragging
                        ? "border-blue-500 bg-blue-50/50 scale-[1.02] shadow-xl"
                        : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                    disabled && "opacity-50 cursor-not-allowed pointer-events-none",
                    selectedFile ? "bg-slate-50 border-solid border-slate-300" : "bg-white"
                )}
            >
                <input
                    id="file-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileInput}
                    disabled={disabled}
                />

                <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                    {selectedFile ? (
                        <div className="animate-in fade-in zoom-in duration-300 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4 shadow-sm">
                                <FileAudio className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 line-clamp-1 max-w-md break-all">
                                {selectedFile.name}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                            <button
                                onClick={clearFile}
                                className="mt-6 px-4 py-2 rounded-full bg-white border border-slate-200 text-slate-600 text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Remove File
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={cn(
                                "w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-transform duration-300",
                                isDragging ? "bg-blue-100 scale-110" : "bg-slate-100 group-hover:scale-110"
                            )}>
                                <Upload className={cn(
                                    "w-8 h-8 transition-colors duration-300",
                                    isDragging ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                                )} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-base font-medium text-slate-700">
                                    Drop your audio file here
                                </p>
                                <p className="text-sm text-slate-400">
                                    or click to browse from your computer
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 text-red-600 text-sm flex items-center justify-center animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}
        </div>
    );
}
