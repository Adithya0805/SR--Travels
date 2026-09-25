import { useState } from 'react';
import faqData from '../../data/faq.json';

export default function FAQAccordion() {
  const [openId, setOpenId] = useState(1); // First item open by default

  const toggleItem = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faqs" className="py-16 md:py-24 bg-slate-50">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <span className="text-accent font-semibold text-xs uppercase tracking-wider bg-amber-500/10 text-amber-800 px-3 py-1 rounded-full">
            Got Questions?
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-dark mt-3">Frequently Asked Questions</h2>
          <p className="text-slate-600 text-base mt-2">
            Everything you need to know about booking, fare calculation, and policies.
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => toggleItem(item.id)}
                  className="w-full text-left p-5 flex items-center justify-between font-semibold text-base md:text-lg text-dark hover:text-accent transition-colors gap-4"
                >
                  <span>{item.question}</span>
                  <span className={`text-xl transition-transform duration-200 ${isOpen ? 'rotate-45 text-accent' : 'text-slate-400'}`}>
                    ➕
                  </span>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
