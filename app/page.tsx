"use client";

import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { ProcessingStatus, type Step } from "@/components/ProcessingStatus";
import { ResultViewer } from "@/components/ResultViewer";
import { AlertCircle } from "lucide-react";

type TranscribeSuccessResponse = {
  transcript: string;
  minutes: string;
  meta: {
    modelUsed: string;
  };
};

type ErrorResponse = {
  error?: string;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export default function Home() {
  const [status, setStatus] = useState<Step>("uploading"); // utilizing 'uploading' state as initial idle state too
  const [transcript, setTranscript] = useState<string>("");
  const [minutes, setMinutes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [usedModel, setUsedModel] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string>("");

  const handleFileSelect = async (file: File) => {
    if (!apiKey.trim()) {
      setError("Please enter your Gemini API Key first.");
      setStatus("error");
      return;
    }

    setStatus("transcribing");
    setError(null);
    setTranscript("");
    setMinutes("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/transcribe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`
        },
        body: formData,
      });

      const data = (await response.json()) as TranscribeSuccessResponse | ErrorResponse;

      if (!response.ok) {
        throw new Error(data.error || "Failed to process file");
      }

      // Since our API currently does both in one sequence server-side, 
      // we simulate the step change for UX or receive partials if we streamed (future improvement).
      // For now, we just transition to summarizing then complete immediately when data returns.
      setStatus("summarizing");

      // Artificial delay to let user see the state change (optional, just for UX feel)
      await new Promise(r => setTimeout(r, 800));

      if (!("transcript" in data) || !("minutes" in data) || !("meta" in data)) {
        throw new Error("Unexpected API response");
      }

      setTranscript(data.transcript);
      setMinutes(data.minutes);
      setUsedModel(data.meta.modelUsed);
      setStatus("completed");

    } catch (error: unknown) {
      console.error(error);
      setError(getErrorMessage(error));
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC] p-8 md:p-16">
      <div className="max-w-7xl mx-auto space-y-12">
        <header className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Smart <span className="text-blue-600">Minutes</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Upload your meeting audio. We&apos;ll transcribe it and generate detailed, structured minutes using advanced AI.
          </p>
        </header>

        {status === "uploading" || status === "error" ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative z-10">
              <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-2">
                Gemini API Key
              </label>
              <input
                id="apiKey"
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  if (error === "Please enter your Gemini API Key first.") setError(null);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-slate-400 bg-slate-50 focus:bg-white"
              />
              <p className="text-xs text-slate-500 mt-2">
                Your API key is only used for this session and is not stored permanently.
              </p>
            </div>
            <FileUploader onFileSelect={handleFileSelect} disabled={status === "error" && error !== "Please enter your Gemini API Key first."} />
          </div>
        ) : null}

        {status !== "uploading" && (
          <ProcessingStatus status={status} />
        )}

        {error && (
          <div className="max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error} <button onClick={() => setStatus("uploading")} className="underline ml-2">Try again</button></p>
          </div>
        )}

        {status === "completed" && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-8">
            {usedModel && usedModel.includes("flash") && (
              <div className="max-w-2xl mx-auto p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm text-center">
                Note: High traffic detected. Processed using lightweight model for speed.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[800px]">
              <ResultViewer title="Structured Minutes" content={minutes} />
              <ResultViewer title="Full Transcript" content={transcript} />
            </div>

            <div className="text-center pt-8">
              <button
                onClick={() => setStatus("uploading")}
                className="px-8 py-3 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                Process Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
