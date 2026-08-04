import React from 'react';
import { Clock, User } from 'lucide-react';

export const BlogPage: React.FC<{ onOpenDemo: () => void }> = () => {
  const articles = [
    {
      category: "Channel Partner Growth",
      title: "5 Hidden Reasons Why Real Estate CPs Lose 30% of Site Visit Conversions",
      date: "July 28, 2026",
      readTime: "6 min read",
      author: "Vikram Malhotra",
      excerpt: "Discover how delayed phone callbacks and un-synced buyer notes slash site visit conversion rates for Indian brokerage firms."
    },
    {
      category: "Sales Automation",
      title: "Why Voice & Audio Alarms Outperform Standard Mobile Push Notifications",
      date: "July 20, 2026",
      readTime: "4 min read",
      author: "Anita Sharma",
      excerpt: "Standard mobile notifications get swiped away. Audio chimes and spoken voice alerts guarantee sales executive compliance."
    },
    {
      category: "Developer Relations",
      title: "How to Negotiate Higher Builder Commission Overrides in 2026",
      date: "July 12, 2026",
      readTime: "8 min read",
      author: "Rajesh Singhania",
      excerpt: "Proven strategies for real estate channel partners to secure 3.5% to 5% commission rates with top tier developers."
    }
  ];

  return (
    <div className="bg-[#050505] text-slate-100 min-h-screen pt-32 pb-24 px-6 lg:px-12 selection:bg-[#C8A45D] selection:text-black">
      <div className="max-w-6xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-xs font-bold text-[#C8A45D] uppercase tracking-widest">Industry Knowledge & Insights</span>
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight">
            The REALVION Real Estate Journal
          </h1>
          <p className="text-base text-slate-400 font-light max-w-xl mx-auto">
            Practical strategies, market analysis, and sales automation guides for real estate channel partners.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {articles.map((art, idx) => (
            <div key={idx} className="p-8 rounded-3xl bg-[#101010] border border-white/[0.08] hover:border-[#C8A45D]/40 transition space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#C8A45D]/10 text-[#C8A45D] border border-[#C8A45D]/20">
                  {art.category}
                </span>
                <h3 className="text-lg font-bold text-white leading-snug">{art.title}</h3>
                <p className="text-xs text-slate-400 font-light leading-relaxed">{art.excerpt}</p>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1"><User className="h-3 w-3 text-[#C8A45D]" /> {art.author}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-400" /> {art.readTime}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
