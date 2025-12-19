import React from "react";
import { Loader2, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/utils/cn";

export type Step = "uploading" | "transcribing" | "summarizing" | "completed" | "error";

interface ProcessingStatusProps {
    status: Step;
}

export function ProcessingStatus({ status }: ProcessingStatusProps) {
    const steps = [
        { id: "uploading", label: "Uploading Audio" },
        { id: "transcribing", label: "Transcribing Speech" },
        { id: "summarizing", label: "Generating Minutes" },
    ];

    const getCurrentStepIndex = () => {
        switch (status) {
            case "uploading": return 0;
            case "transcribing": return 1;
            case "summarizing": return 2;
            case "completed": return 3;
            case "error": return -1;
            default: return 0;
        }
    };

    const currentStepIndex = getCurrentStepIndex();

    if (status === "error") return null;

    return (
        <div className="w-full max-w-2xl mx-auto mt-12">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
                <div className="flex justify-between relative">
                    {/* Connecting Line */}
                    <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 -z-10" />
                    <div
                        className="absolute top-5 left-0 h-0.5 bg-blue-600 transition-all duration-700 -z-10"
                        style={{ width: `${Math.min((currentStepIndex / (steps.length - 1)) * 100, 100)}%` }}
                    />

                    {steps.map((step, index) => {
                        const isCompleted = index < currentStepIndex;
                        const isCurrent = index === currentStepIndex;

                        return (
                            <div key={step.id} className="flex flex-col items-center relative gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                                    isCompleted ? "bg-blue-600 border-blue-600 text-white" :
                                        isCurrent ? "bg-white border-blue-600 text-blue-600 scale-110" :
                                            "bg-white border-slate-200 text-slate-300"
                                )}>
                                    {isCompleted ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : isCurrent ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Circle className="w-5 h-5 fill-current" />
                                    )}
                                </div>
                                <span className={cn(
                                    "text-sm font-medium transition-colors duration-300 absolute top-12 whitespace-nowrap",
                                    isCurrent ? "text-blue-700" :
                                        isCompleted ? "text-slate-700" :
                                            "text-slate-400"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
