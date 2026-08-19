import React, { useState } from 'react';
import { X, Zap, Layers } from 'lucide-react';
import { evaluateFeature, evaluateBulkFeatures } from '../../services/evaluationService';
import { type EvaluationResult, type Feature, type EvaluationContext } from '../../types';
import { EvaluationContextForm } from './EvaluationContextForm';
import { EvaluationResultView } from './EvaluationResultView';
import { BulkEvaluationResultView } from './BulkEvaluationResultView';

interface EvaluationTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
  environmentId: string;
  environmentName: string;
  features: Feature[];
  initialFeatureKey?: string;
}

export const EvaluationTesterModal: React.FC<EvaluationTesterModalProps> = ({
  isOpen,
  onClose,
  environmentId,
  environmentName,
  features,
  initialFeatureKey,
}) => {
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [selectedFeatureKey, setSelectedFeatureKey] = useState(
    initialFeatureKey || (features.length > 0 ? features[0].key : 'checkout-v2')
  );
  const [contextKey, setContextKey] = useState('user-123');
  const [bulkKeysInput, setBulkKeysInput] = useState(
    features.map(f => f.key).join(', ')
  );

  const [isLoading, setIsLoading] = useState(false);
  const [singleResult, setSingleResult] = useState<EvaluationResult | null>(null);
  const [bulkResults, setBulkResults] = useState<EvaluationResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEvaluateSingle = async (context: EvaluationContext) => {
    if (!environmentId || !selectedFeatureKey) return;
    setIsLoading(true);
    setError(null);
    setSingleResult(null);

    try {
      const res = await evaluateFeature(
        environmentId,
        selectedFeatureKey,
        context.key
      );
      if (res.data) {
        setSingleResult(res.data);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Evaluation failed. Please check network connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateBulk = async () => {
    if (!environmentId) return;
    const keys = bulkKeysInput
      .split(',')
      .map(k => k.trim())
      .filter(Boolean);

    if (keys.length === 0) {
      setError('Please specify at least one feature key for bulk evaluation.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setBulkResults(null);

    try {
      const res = await evaluateBulkFeatures(environmentId, {
        context: contextKey.trim() ? { key: contextKey.trim() } : null,
        keys,
      });
      if (res.data) {
        setBulkResults(res.data.results);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Bulk evaluation failed. Please verify features and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink)] text-[var(--cream)] shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-surface)] px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-[var(--cream)]">Evaluate Feature</h2>
              <span className="rounded-md bg-[var(--color-lime)]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[var(--color-lime)]">
                {environmentName}
              </span>
            </div>
            <p className="font-sans text-xs text-[var(--cream)]/60 mt-0.5">
              Simulate decision outcome for a given context
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--cream)]/60 transition hover:bg-white/10 hover:text-[var(--cream)] cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 bg-[var(--color-ink)] max-h-[80vh] overflow-y-auto">
          
          {/* Mode Selector */}
          <div className="flex items-center gap-2 border-b border-[var(--color-line)] pb-4">
            <button
              onClick={() => { setActiveTab('single'); setError(null); }}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-xs font-semibold transition cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-[var(--color-lime)] text-[var(--color-ink)] shadow-sm'
                  : 'text-[var(--cream)]/60 hover:text-[var(--cream)]'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Single Feature
            </button>
            <button
              onClick={() => { setActiveTab('bulk'); setError(null); }}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-mono text-xs font-semibold transition cursor-pointer ${
                activeTab === 'bulk'
                  ? 'bg-[var(--color-lime)] text-[var(--color-ink)] shadow-sm'
                  : 'text-[var(--cream)]/60 hover:text-[var(--cream)]'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Bulk Features
            </button>
          </div>

          {/* Single Mode */}
          {activeTab === 'single' && (
            <div className="space-y-4">
              <EvaluationContextForm
                features={features}
                selectedFeatureKey={selectedFeatureKey}
                onSelectFeatureKey={setSelectedFeatureKey}
                contextKey={contextKey}
                onChangeContextKey={setContextKey}
                onSubmit={handleEvaluateSingle}
                isLoading={isLoading}
              />

              {singleResult && (
                <EvaluationResultView
                  result={singleResult}
                  contextKey={contextKey}
                  environmentId={environmentId}
                />
              )}
            </div>
          )}

          {/* Bulk Mode */}
          {activeTab === 'bulk' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block font-mono text-xs text-[var(--cream)]/70">
                  Context Key
                </label>
                <input
                  type="text"
                  value={contextKey}
                  onChange={e => setContextKey(e.target.value)}
                  placeholder="e.g. user-123"
                  className="w-full rounded-xl border border-[var(--color-line)] bg-[#1c1c1a] px-3.5 py-2.5 font-mono text-xs text-[var(--cream)] focus:border-[var(--color-lime)] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-xs text-[var(--cream)]/70">
                  Requested Feature Keys (Comma-separated)
                </label>
                <input
                  type="text"
                  value={bulkKeysInput}
                  onChange={e => setBulkKeysInput(e.target.value)}
                  placeholder="checkout-v2, dark-mode, new-dashboard"
                  className="w-full rounded-xl border border-[var(--color-line)] bg-[#1c1c1a] px-3.5 py-2.5 font-mono text-xs text-[var(--cream)] focus:border-[var(--color-lime)] focus:outline-none"
                />
              </div>

              <button
                onClick={handleEvaluateBulk}
                disabled={isLoading || !bulkKeysInput.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-lime)] py-2.5 font-mono text-xs font-bold text-[var(--color-ink)] transition hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-md"
              >
                <Layers className="h-3.5 w-3.5" />
                {isLoading ? 'Evaluating Bulk...' : 'Evaluate Bulk'}
              </button>

              {bulkResults && (
                <BulkEvaluationResultView
                  results={bulkResults}
                  contextKey={contextKey}
                />
              )}
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 font-mono text-xs text-rose-300">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
