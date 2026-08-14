import React, { useState } from 'react';
import { Terminal, Copy, Check } from 'lucide-react';

interface DevToolkitProps {
  flagEnabled: boolean;
}

type Language = 'react' | 'node' | 'go' | 'curl';

export const DevToolkit: React.FC<DevToolkitProps> = ({ flagEnabled }) => {
  const [activeTab, setActiveTab] = useState<Language>('react');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const codeRaw: Record<Language, string> = {
    react: `import { useFeatureFlag } from '@featureflags/react';

function CheckoutPage() {
  const isNewCheckout = useFeatureFlag('new_checkout');

  return isNewCheckout ? (
    <BuyNowButton onClick={checkout} />
  ) : (
    <AddToCartButton onClick={addToCart} />
  );
}`,
    node: `const client = require('@featureflags/node').client;

app.get('/store/checkout', async (req, res) => {
  const flag = await client.evaluate('new_checkout', req.user.id);
  
  if (flag.enabled) {
    res.render('new_checkout_experience');
  } else {
    res.render('old_checkout');
  }
});`,
    go: `import "github.com/feature-flag/sdk-go"

func checkoutHandler(w http.ResponseWriter, r *http.Request) {
    flag := sdk.Evaluate("new_checkout", r.Context())

    if flag.Enabled {
        renderNewCheckout(w)
    } else {
        renderOldCheckout(w)
    }
}`,
    curl: `curl -X POST https://api.flags.dev/v1/evaluate \\
  -H "Authorization: Bearer sdk_live_8a992f..." \\
  -d '{ "key": "new_checkout", "userId": "usr_991" }'

# Response:
# { "enabled": ${flagEnabled ? 'true' : 'false'}, "reason": "rule_match" }`
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-[var(--theme-surface)] border border-[var(--theme-border)] rounded overflow-hidden font-mono text-[10px] select-none transition-all duration-300">
      
      {/* Titlebar */}
      <div className="bg-[var(--theme-surface-subtle)] px-4 py-3 border-b border-[var(--theme-border)] flex justify-between items-center text-current">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-error/70"></div>
          <div className="w-2 h-2 rounded-full bg-warning/80"></div>
          <div className="w-2 h-2 rounded-full bg-success/80"></div>
          <span className="text-[var(--theme-text-muted)] ml-2 text-[9px] font-bold">INTEGRATION_SDK</span>
        </div>
        <button 
          onClick={() => handleCopy(codeRaw[activeTab])}
          className="text-[var(--theme-text-muted)] hover:text-current transition-colors flex items-center gap-1 cursor-pointer font-bold"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'COPIED' : 'COPY'}</span>
        </button>
      </div>

      {/* Language tabs */}
      <div className="flex bg-[var(--theme-surface-subtle)] border-b border-[var(--theme-border)] text-[9px] text-current">
        {(['react', 'node', 'go', 'curl'] as Language[]).map((lang) => (
          <button
            key={lang}
            onClick={() => setActiveTab(lang)}
            className={`px-3 py-1.5 border-r border-[var(--theme-border)] font-bold tracking-tight transition-all uppercase cursor-pointer ${
              activeTab === lang 
                ? 'bg-[var(--theme-surface)] border-b border-b-[#c6fd50] font-black' 
                : 'text-[var(--theme-text-muted)] hover:text-current'
            }`}
          >
            {lang === 'node' ? 'NodeJS' : lang}
          </button>
        ))}
      </div>

      {/* Code body */}
      <div className="p-4 bg-[var(--theme-surface)] min-h-[170px] overflow-x-auto relative text-[var(--theme-text-secondary)] leading-relaxed">
        {activeTab === 'react' && (
          <pre>
            <div><span className="text-pink-600 font-bold">import</span> &#123; useFeatureFlag &#125; <span className="text-pink-600 font-bold">from</span> <span className="text-emerald-600 font-bold">'@featureflags/react'</span>;</div>
            <div className="text-[var(--theme-text-muted)]">// Hook evaluates flag reactivity in browser</div>
            <div><span className="text-blue-600">function</span> <span className="text-amber-700">CheckoutPage</span>() &#123;</div>
            <div>  <span className="text-blue-600">const</span> isNewCheckout = <span className="text-amber-700">useFeatureFlag</span>(<span className="text-emerald-600">'new_checkout'</span>);</div>
            <br />
            <div>  <span className="text-pink-600 font-bold">return</span> isNewCheckout ? (</div>
            <div className={`transition-all duration-300 pl-4 py-0.5 rounded ${flagEnabled ? 'bg-[#c6fd50]/15 text-current font-bold border-l-2 border-[#c6fd50]' : 'opacity-30'}`}>
              &lt;<span className="text-cyan-700 font-bold">BuyNowButton</span> onClick=&#123;checkout&#125; /&gt; <span className="text-[8px] opacity-80 ml-1">{flagEnabled ? '◀ ACTIVE' : ''}</span>
            </div>
            <div>  ) : (</div>
            <div className={`transition-all duration-300 pl-4 py-0.5 rounded ${!flagEnabled ? 'bg-current/5 text-current font-bold border-l-2 border-[var(--theme-border-strong)]' : 'opacity-30'}`}>
              &lt;<span className="text-cyan-700">AddToCartButton</span> onClick=&#123;addToCart&#125; /&gt; <span className="text-[8px] opacity-80 ml-1">{!flagEnabled ? '◀ ACTIVE' : ''}</span>
            </div>
            <div>  );</div>
            <div>&#125;</div>
          </pre>
        )}

        {activeTab === 'node' && (
          <pre>
            <div><span className="text-blue-600">const</span> client = <span className="text-amber-700">require</span>(<span className="text-emerald-600">'@featureflags/node'</span>).client;</div>
            <br />
            <div>app.<span className="text-amber-700">get</span>(<span className="text-emerald-600">'/store/checkout'</span>, <span className="text-blue-600">async</span> (req, res) =&gt; &#123;</div>
            <div>  <span className="text-blue-600">const</span> flag = <span className="text-pink-600 font-bold">await</span> client.<span className="text-amber-700">evaluate</span>(<span className="text-emerald-600">'new_checkout'</span>, req.user.id);</div>
            <br />
            <div className={`transition-all duration-300 pl-2 py-0.5 rounded ${flagEnabled ? 'bg-[#c6fd50]/15 text-current font-bold border-l-2 border-[#c6fd50]' : 'opacity-30'}`}>
              &nbsp;&nbsp;<span className="text-pink-600 font-bold">if</span> (flag.enabled) &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;res.<span className="text-amber-700">render</span>(<span className="text-emerald-600">'new_checkout_experience'</span>); <span className="text-[8px] ml-1">{flagEnabled ? '◀ ACTIVE' : ''}</span><br />
              &nbsp;&nbsp;&#125;
            </div>
            <div className={`transition-all duration-300 pl-2 py-0.5 rounded ${!flagEnabled ? 'bg-current/5 text-current font-bold border-l-2 border-[var(--theme-border-strong)]' : 'opacity-30'}`}>
              &nbsp;&nbsp;<span className="text-pink-600 font-bold">else</span> &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;res.<span className="text-amber-700">render</span>(<span className="text-emerald-600">'old_checkout'</span>); <span className="text-[8px] ml-1">{!flagEnabled ? '◀ ACTIVE' : ''}</span><br />
              &nbsp;&nbsp;&#125;
            </div>
            <div>&#125;);</div>
          </pre>
        )}

        {activeTab === 'go' && (
          <pre>
            <div><span className="text-pink-600 font-bold">import</span> <span className="text-emerald-600">"github.com/feature-flag/sdk-go"</span></div>
            <br />
            <div><span className="text-blue-600">func</span> <span className="text-amber-700">checkoutHandler</span>(w http.ResponseWriter, r *http.Request) &#123;</div>
            <div>    flag := sdk.<span className="text-amber-700">Evaluate</span>(<span className="text-emerald-600">"new_checkout"</span>, r.Context())</div>
            <br />
            <div className={`transition-all duration-300 pl-2 py-0.5 rounded ${flagEnabled ? 'bg-[#c6fd50]/15 text-current font-bold border-l-2 border-[#c6fd50]' : 'opacity-30'}`}>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-600 font-bold">if</span> flag.Enabled &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-700">renderNewCheckout</span>(w) <span className="text-[8px] ml-1">{flagEnabled ? '◀ ACTIVE' : ''}</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&#125;
            </div>
            <div className={`transition-all duration-300 pl-2 py-0.5 rounded ${!flagEnabled ? 'bg-current/5 text-current font-bold border-l-2 border-[var(--theme-border-strong)]' : 'opacity-30'}`}>
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-pink-600 font-bold">else</span> &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-amber-700">renderOldCheckout</span>(w) <span className="text-[8px] ml-1">{!flagEnabled ? '◀ ACTIVE' : ''}</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;&#125;
            </div>
            <div>&#125;</div>
          </pre>
        )}

        {activeTab === 'curl' && (
          <pre>
            <div><span className="text-cyan-700 font-bold">curl</span> -X POST https://api.flags.dev/v1/evaluate \</div>
            <div>  -H <span className="text-emerald-600">"Authorization: Bearer sdk_live_8a992f..."</span> \</div>
            <div>  -d <span className="text-emerald-600">'"key": "new_checkout", "userId": "usr_991"'</span></div>
            <br />
            <div className="text-[var(--theme-text-muted)]"># Payload Response Evaluation</div>
            <div>&#123;</div>
            <div className={flagEnabled ? 'text-current font-bold' : ''}>  <span className="text-blue-600">"enabled"</span>: {flagEnabled ? 'true' : 'false'},</div>
            <div>  <span className="text-blue-600">"reason"</span>: <span className="text-emerald-600">"rule_match"</span>,</div>
            <div>  <span className="text-blue-600">"rulesMatched"</span>: [<span className="text-emerald-600">"beta_testing_group"</span>]</div>
            <div>&#125;</div>
          </pre>
        )}
      </div>

      {/* Footer */}
      <div className="bg-[var(--theme-surface-subtle)] p-3 border-t border-[var(--theme-border)] flex justify-between items-center text-[8px] text-[var(--theme-text-muted)] text-current">
        <span className="flex items-center gap-1 font-bold">
          <Terminal className="w-2.5 h-2.5" />
          COMPILE OK
        </span>
        <span>SIZE: 2.1 KB</span>
      </div>
    </div>
  );
};
