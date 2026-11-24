import { useState } from 'react';
import Markdown from 'react-markdown';
import { ExternalLink, Flag, AlertCircle, Scale } from 'lucide-react';
import { OFFICIAL_RESOURCES } from '../data/studySyllabus';

export interface StudyMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  moduleTopic: string;
  timestamp: string;
}

interface StudyMessageCardProps {
  message: StudyMessage;
}

export function StudyMessageCard({ message }: StudyMessageCardProps) {
  const [mistakeFlagged, setMistakeFlagged] = useState(false);

  if (message.role === 'user') {
    return (
      <article className="flex justify-end">
        <div className="max-w-2xl bg-[#1E3A5F] text-white rounded-xl px-5 py-3.5 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-stone-300 mb-1">
            <span>Question</span>
            <span aria-hidden="true">·</span>
            <span>{message.moduleTopic}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">{message.timestamp}</span>
          </div>
          <p className="text-sm sm:text-[15px] leading-relaxed whitespace-pre-wrap">
            {message.text}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-white border border-stone-200 rounded-xl shadow-xs overflow-hidden">
      <div className="px-5 py-3 bg-[#F6F3EC] border-b border-stone-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <Scale className="w-3.5 h-3.5 text-[#1E3A5F]" aria-hidden="true" />
          <span className="font-semibold text-stone-900">Plain-English Legal Summary</span>
          <span aria-hidden="true">·</span>
          <span>{message.moduleTopic}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">{message.timestamp}</span>
        </div>

        <button
          type="button"
          onClick={() => setMistakeFlagged((prev) => !prev)}
          aria-pressed={mistakeFlagged}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-ring ${
            mistakeFlagged
              ? 'bg-amber-50 border-amber-300 text-amber-900'
              : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300 hover:text-stone-900'
          }`}
        >
          <Flag className="w-3.5 h-3.5" aria-hidden="true" />
          {mistakeFlagged ? 'Verification Notice Shown' : 'Report AI Mistake'}
        </button>
      </div>

      {mistakeFlagged && (
        <div
          role="status"
          className="px-5 py-3.5 bg-amber-50 border-b border-amber-200 flex items-start gap-2.5 text-xs sm:text-sm text-amber-950 leading-relaxed"
        >
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong>AI Accuracy Reminder:</strong> AI models can occasionally misquote section numbers, dates, or statutory exceptions. Because LexPlain UK stores zero prompts or logs, nothing is transmitted when you flag an issue—please verify exact statutory wording directly on{' '}
            <a
              href="https://www.legislation.gov.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium text-amber-950"
            >
              legislation.gov.uk
            </a>{' '}
            or official guidance on{' '}
            <a
              href="https://www.citizensadvice.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium text-amber-950"
            >
              citizensadvice.org.uk
            </a>
            .
          </div>
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="study-prose">
          <Markdown>{message.text}</Markdown>
        </div>
      </div>

      {/* Official Public Resource Bar */}
      <div className="px-5 py-3.5 bg-[#FBF9F5] border-t border-stone-200">
        <div className="text-[11px] font-medium text-stone-500 mb-2">
          Official England &amp; Wales Public Resources
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {OFFICIAL_RESOURCES.map((res) => (
            <a
              key={res.domain}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              title={res.purpose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-200 text-stone-800 hover:border-[#1E3A5F] hover:text-[#1E3A5F] transition-colors whitespace-nowrap shrink-0 focus-ring"
            >
              <span>{res.label}</span>
              <ExternalLink className="w-3 h-3 text-stone-400" aria-hidden="true" />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}
