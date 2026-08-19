import React, { useState } from 'react';
import { Play, Plus, Trash2 } from 'lucide-react';
import { type Feature, type EvaluationContext } from '../../types';

interface AttributeRow {
  id: string;
  key: string;
  value: string;
}

interface EvaluationContextFormProps {
  features: Feature[];
  selectedFeatureKey: string;
  onSelectFeatureKey: (key: string) => void;
  contextKey: string;
  onChangeContextKey: (key: string) => void;
  onSubmit: (context: EvaluationContext) => void;
  isLoading: boolean;
}

export const EvaluationContextForm: React.FC<EvaluationContextFormProps> = ({
  features,
  selectedFeatureKey,
  onSelectFeatureKey,
  contextKey,
  onChangeContextKey,
  onSubmit,
  isLoading,
}) => {
  const [attributes, setAttributes] = useState<AttributeRow[]>([]);
  const [showAttributes, setShowAttributes] = useState(false);

  const handleAddAttribute = () => {
    setAttributes(prev => [...prev, { id: String(Date.now()), key: '', value: '' }]);
  };

  const handleRemoveAttribute = (id: string) => {
    setAttributes(prev => prev.filter(a => a.id !== id));
  };

  const handleUpdateAttribute = (id: string, field: 'key' | 'value', val: string) => {
    setAttributes(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contextKey.trim()) return;

    const attrMap: Record<string, unknown> = {};
    attributes.forEach(a => {
      if (a.key.trim()) {
        attrMap[a.key.trim()] = a.value.trim();
      }
    });

    onSubmit({
      key: contextKey.trim(),
      attributes: Object.keys(attrMap).length > 0 ? attrMap : undefined,
    });
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* Feature Selector */}
      <div>
        <label className="mb-1.5 block font-mono text-xs text-[var(--cream)]/70">
          Feature
        </label>
        {features.length > 0 ? (
          <select
            value={selectedFeatureKey}
            onChange={e => onSelectFeatureKey(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#1c1c1a] px-3.5 py-2.5 font-mono text-xs text-[var(--cream)] focus:border-[var(--color-lime)] focus:outline-none cursor-pointer"
          >
            {features.map(f => (
              <option key={f.id} value={f.key} className="bg-[#131311] text-[var(--cream)]">
                {f.name} ({f.key})
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={selectedFeatureKey}
            onChange={e => onSelectFeatureKey(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-line)] bg-[#1c1c1a] px-3.5 py-2.5 font-mono text-xs text-[var(--cream)] focus:border-[var(--color-lime)] focus:outline-none"
            placeholder="e.g. checkout-v2"
          />
        )}
      </div>

      {/* Context Key */}
      <div>
        <label className="mb-1.5 block font-mono text-xs text-[var(--cream)]/70">
          Context Key
        </label>
        <input
          type="text"
          value={contextKey}
          onChange={e => onChangeContextKey(e.target.value)}
          placeholder="e.g. user-123"
          className="w-full rounded-xl border border-[var(--color-line)] bg-[#1c1c1a] px-3.5 py-2.5 font-mono text-xs text-[var(--cream)] placeholder:text-[var(--cream)]/30 focus:border-[var(--color-lime)] focus:outline-none"
        />
      </div>

      {/* Context Attributes (Optional context data) */}
      <div className="pt-1">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAttributes(!showAttributes)}
            className="font-mono text-xs text-[var(--cream)]/60 hover:text-[var(--cream)] transition cursor-pointer"
          >
            {showAttributes ? '− Hide context attributes' : '+ Add optional context attributes'}
          </button>
        </div>

        {showAttributes && (
          <div className="mt-3 space-y-2 rounded-xl border border-[var(--color-line)] bg-[#1c1c1a] p-3.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[11px] font-semibold text-[var(--cream)]/80">
                Context attributes
              </span>
              <button
                type="button"
                onClick={handleAddAttribute}
                className="inline-flex items-center gap-1 rounded bg-[#131311] border border-[var(--color-line)] px-2 py-0.5 font-mono text-[10px] text-[var(--color-lime)] hover:bg-[var(--color-lime)] hover:text-[var(--color-ink)] transition cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add
              </button>
            </div>
            
            <p className="font-mono text-[10px] text-[var(--cream)]/50">
              Sent as part of EvaluationContext. Attributes are reserved context data and do not currently alter evaluation.
            </p>

            {attributes.length === 0 ? (
              <p className="font-mono text-[10px] text-[var(--cream)]/40 italic pt-1">
                No attributes specified.
              </p>
            ) : (
              <div className="space-y-2 pt-1">
                {attributes.map(attr => (
                  <div key={attr.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="key (e.g. country)"
                      value={attr.key}
                      onChange={e => handleUpdateAttribute(attr.id, 'key', e.target.value)}
                      className="w-1/2 rounded-lg border border-[var(--color-line)] bg-[#131311] px-2.5 py-1 font-mono text-xs text-[var(--cream)] focus:outline-none"
                    />
                    <span className="font-mono text-xs text-[var(--cream)]/40">:</span>
                    <input
                      type="text"
                      placeholder="value (e.g. IN)"
                      value={attr.value}
                      onChange={e => handleUpdateAttribute(attr.id, 'value', e.target.value)}
                      className="w-1/2 rounded-lg border border-[var(--color-line)] bg-[#131311] px-2.5 py-1 font-mono text-xs text-[var(--cream)] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAttribute(attr.id)}
                      className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Evaluate Button */}
      <button
        type="submit"
        disabled={isLoading || !contextKey.trim() || !selectedFeatureKey}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-lime)] py-2.5 font-mono text-xs font-bold text-[var(--color-ink)] transition hover:opacity-90 disabled:opacity-50 cursor-pointer shadow-md mt-2"
      >
        <Play className="h-3.5 w-3.5 fill-current" />
        {isLoading ? 'Evaluating...' : 'Evaluate'}
      </button>
    </form>
  );
};
