import React, { useState } from 'react';
import { ThumbsUp, HelpCircle, ThumbsDown, MessageSquare, CheckCircle, Sparkles } from 'lucide-react';
import { FeedbackRating } from '../../types';

interface FeedbackModalProps {
  incidentId: string;
  onSubmit: (data: { incident_id: string; rating: FeedbackRating; comments?: string; engineer_name?: string }) => Promise<void>;
  existingRating?: FeedbackRating;
  existingComments?: string;
}

export const FeedbackCard: React.FC<FeedbackModalProps> = ({
  incidentId,
  onSubmit,
  existingRating,
  existingComments,
}) => {
  const [rating, setRating] = useState<FeedbackRating>(existingRating || 'WORKED');
  const [comments, setComments] = useState(existingComments || '');
  const [engineerName, setEngineerName] = useState('Site Reliability Engineer');
  const [submitted, setSubmitted] = useState(Boolean(existingRating));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        incident_id: incidentId,
        rating,
        comments,
        engineer_name: engineerName,
      });
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-4 rounded-xl bg-gradient-to-r from-pink-950/20 via-purple-950/20 to-slate-900 border border-pink-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              Continuous Learning Memory Updated
            </h4>
            <p className="text-[11px] text-slate-300">
              Engineer rating <span className="font-semibold text-pink-300">[{rating}]</span> and notes indexed into ChromaDB for future incident similarity search.
            </p>
          </div>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          className="text-xs text-slate-400 hover:text-white underline font-medium"
        >
          Edit Feedback
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-pink-400" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
            Engineer Outcome Feedback & Reinforcement
          </h4>
        </div>
        <span className="text-[10px] text-slate-400">
          Feeds into long-term operational memory
        </span>
      </div>

      <div>
        <p className="text-xs text-slate-300 mb-2 font-medium">
          How effective was the AI Agent's diagnosis and recommended remediation?
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setRating('WORKED')}
            className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
              rating === 'WORKED'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/10'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
            <span>Worked (100%)</span>
          </button>

          <button
            type="button"
            onClick={() => setRating('PARTIALLY_WORKED')}
            className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
              rating === 'PARTIALLY_WORKED'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500 shadow-sm shadow-amber-500/10'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Partially Worked</span>
          </button>

          <button
            type="button"
            onClick={() => setRating('DIDNT_WORK')}
            className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition ${
              rating === 'DIDNT_WORK'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500 shadow-sm shadow-rose-500/10'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
            <span>Didn't Work</span>
          </button>
        </div>
      </div>

      <div>
        <label className="text-[11px] font-medium text-slate-400 block mb-1">
          Operational Comments & Lessons (Indexed into Semantic Memory):
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="e.g. Restarting the connection pool cleared hung socket handles immediately. Good resolution steps."
          className="w-full h-18 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500"
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Reviewer:</span>
          <input
            type="text"
            value={engineerName}
            onChange={(e) => setEngineerName(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200 font-medium"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-md shadow-pink-600/20 transition flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSubmitting ? 'Saving Memory...' : 'Submit Feedback & Save Memory'}</span>
        </button>
      </div>
    </div>
  );
};
