// Simple i18n Dictionary
const translations = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.market": "Market Explorer",
    "nav.simulator": "Simulator",
    "nav.advisor": "AI Advisor",
    "nav.automode": "Full Access",
    "nav.settings": "Settings",
    "nav.fearbreaker": "Fear Profiler",
    
    "dashboard.portfolio": "Total Portfolio Value",
    "dashboard.confidence": "Confidence Score",
    "dashboard.marketPulse": "Market Pulse",
    "dashboard.trending": "Trending Stocks",
    "dashboard.aiInsight": "AI Insight",
    
    "lbl.demo": "Demo Mode — Real Portfolio Soon",
    "lbl.invest": "Invest",
    "lbl.simulate": "Simulate",
    "lbl.explore": "Explore",
    "lbl.chat": "AI Chat"
  },
  hi: {
    "nav.dashboard": "डैशबोर्ड",
    "nav.market": "बाजार एक्सप्लोरर",
    "nav.simulator": "सिमुलेटर",
    "nav.advisor": "एआई सलाहकार",
    "nav.automode": "पूर्ण एक्सेस",
    "nav.settings": "सेटिंग्स",
    "nav.fearbreaker": "डर विश्लेषक",
    
    "dashboard.portfolio": "कुल पोर्टफोलियो मूल्य",
    "dashboard.confidence": "आत्मविश्वास स्कोर",
    "dashboard.marketPulse": "बाजार की नब्ज",
    "dashboard.trending": "ट्रेंडिंग स्टॉक्स",
    "dashboard.aiInsight": "एआई इनसाइट",
    
    "lbl.demo": "डेमो मोड - असली पोर्टफोलियो जल्द",
    "lbl.invest": "निवेश करें",
    "lbl.simulate": "सिमुलेट करें",
    "lbl.explore": "एक्सप्लोर करें",
    "lbl.chat": "एआई चैट"
  }
};

export const i18n = {
  get lang() {
    return localStorage.getItem('feargon_lang') || 'en';
  },

  set lang(l) {
    if (translations[l]) {
      localStorage.setItem('feargon_lang', l);
      this.parse(document.body);
    }
  },

  t(key) {
    const dict = translations[this.lang] || translations['en'];
    return dict[key] || key;
  },

  parse(container) {
    const elements = container.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key) {
        if (el.tagName === 'INPUT' && el.type === 'placeholder') {
           el.placeholder = this.t(key);
        } else {
           // To avoid removing inner icons like SVGs, we might need carefully targeting text nodes
           // but for simple labels, textContent is fine. We will wrap text in spans in HTML.
           // If 'data-i18n-target' exists, it means we must select a child. For standard use:
           const targetSpan = el.querySelector('.i18n-text');
           if (targetSpan) {
             targetSpan.textContent = this.t(key);
           } else {
             el.textContent = this.t(key);
           }
        }
      }
    });
  }
};
