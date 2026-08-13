import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

type Lang = 'react' | 'node' | 'go';

const snippets: Record<Lang, { lines: { code: string; highlight?: boolean }[] }> = {
  react: {
    lines: [
      { code: `import { useFeatureFlag } from '@flags/react';` },
      { code: `` },
      { code: `function CheckoutPage() {` },
      { code: `  const isNew = useFeatureFlag('new_checkout');` },
      { code: `` },
      { code: `  return isNew ? (`, highlight: true },
      { code: `    <BuyNowButton />`, highlight: true },
      { code: `  ) : (`, highlight: true },
      { code: `    <AddToCartButton />` },
      { code: `  );` },
      { code: `}` },
    ],
  },
  node: {
    lines: [
      { code: `const client = require('@flags/node');` },
      { code: `` },
      { code: `app.get('/checkout', async (req, res) => {` },
      { code: `  const flag = await client.evaluate(` },
      { code: `    'new_checkout', req.user.id` },
      { code: `  );`, },
      { code: `` },
      { code: `  if (flag.enabled) {`, highlight: true },
      { code: `    res.render('new_checkout');`, highlight: true },
      { code: `  } else {` },
      { code: `    res.render('old_checkout');` },
      { code: `  }` },
      { code: `});` },
    ],
  },
  go: {
    lines: [
      { code: `import sdk "github.com/flags/sdk-go"` },
      { code: `` },
      { code: `func handler(w http.ResponseWriter, r *http.Request) {` },
      { code: `  flag := sdk.Evaluate("new_checkout",` },
      { code: `    r.Context())` },
      { code: `` },
      { code: `  if flag.Enabled {`, highlight: true },
      { code: `    renderNewCheckout(w)`, highlight: true },
      { code: `  } else {` },
      { code: `    renderOldCheckout(w)` },
      { code: `  }` },
      { code: `}` },
    ],
  },
};

export const SdkScene: React.FC = () => {
  const [activeLang, setActiveLang] = useState<Lang>('react');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const code = snippets[activeLang].lines.map(l => l.code).join('\n');
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full h-full bg-[#0c0c0d] flex flex-col select-none overflow-hidden">
      
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <div className="text-[9px] font-mono text-[#d4fe00] tracking-widest uppercase font-bold">SDK INTEGRATION</div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[8px] font-mono text-white/50 hover:text-white cursor-pointer transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-[#d4fe00]" /> : <Copy className="w-3 h-3" />}
          {copied ? 'COPIED' : 'COPY'}
        </button>
      </div>

      {/* Language tabs */}
      <div className="flex items-center px-3 gap-1 shrink-0">
        {(['react', 'node', 'go'] as Lang[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveLang(lang)}
            className={`px-2.5 py-1 rounded-full text-[8px] font-mono font-bold uppercase transition-all cursor-pointer ${
              activeLang === lang
                ? 'bg-[#d4fe00] text-[#0c0c0d]'
                : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'
            }`}
          >
            {lang === 'node' ? 'Node.js' : lang.charAt(0).toUpperCase() + lang.slice(1)}
          </button>
        ))}
      </div>

      {/* Code block */}
      <div className="flex-1 px-3 py-3 overflow-y-auto">
        <pre className="font-mono text-[9px] leading-relaxed space-y-0.5">
          {snippets[activeLang].lines.map((line, idx) => (
            <div
              key={idx}
              className={`px-1 rounded transition-all duration-200 ${
                line.highlight
                  ? 'bg-[#d4fe00]/15 text-[#d4fe00] border-l-2 border-[#d4fe00] pl-2'
                  : 'text-white/60'
              }`}
            >
              {line.code || '\u00A0'}
            </div>
          ))}
        </pre>
      </div>

      {/* Supported environments */}
      <div className="px-3 pb-3 shrink-0">
        <div className="flex flex-wrap gap-1">
          {['React', 'Next.js', 'Node.js', 'Go', 'Python', 'cURL'].map((env) => (
            <span key={env} className="text-[7px] font-mono bg-white/5 border border-white/10 text-white/60 px-1.5 py-0.5 rounded">
              {env}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
