import React from 'react';
import { Globe, X, Check, ShieldCheck, HeartHandshake, Cpu, Sparkles } from 'lucide-react';

interface SdgInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SdgInfoModal: React.FC<SdgInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FD6925] text-white flex items-center justify-center font-bold text-xl shadow-sm">
              9
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B6544]">
                United Nations Global Goals
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-artisan text-[#423023]">
                SDG 9: Industry, Innovation & Infrastructure
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#887463] hover:bg-[#EFE7DA] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mission Statement */}
        <div className="p-4 rounded-2xl bg-[#F5ECE0] border border-[#E3D4C0] space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wide text-[#654E3C] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#C59B3C]" />
            How CraftCopy Powers SDG 9 for Local Craftsmen
          </h4>
          <p className="text-xs sm:text-sm text-[#4E3928] leading-relaxed">
            Sustainable Development Goal 9 focuses on building resilient infrastructure, promoting inclusive and sustainable industrialization, and fostering innovation. CraftCopy directly champions this by empowering small-scale artisanal producers and independent makers with modern AI tools.
          </p>
        </div>

        {/* 3 Key Target Pillars */}
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#D5C7B6]">
            <div className="w-8 h-8 rounded-lg bg-[#E7EFE6] text-[#4E654E] flex items-center justify-center shrink-0 mt-0.5">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#423023]">
                Target 9.3: Equal Access to Digital Technology & Markets
              </h5>
              <p className="text-xs text-[#715E4E] mt-0.5 leading-relaxed">
                Large corporations employ entire marketing teams. CraftCopy levels the playing field by providing micro-artisans with instant, high-quality copywriting and omnichannel campaign tools at zero agency cost.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#D5C7B6]">
            <div className="w-8 h-8 rounded-lg bg-[#FFF2DA] text-[#A6781B] flex items-center justify-center shrink-0 mt-0.5">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#423023]">
                Target 9.b: Fostering Sustainable Local Craft Infrastructure
              </h5>
              <p className="text-xs text-[#715E4E] mt-0.5 leading-relaxed">
                Traditional crafts (pottery, woodworking, textiles) are vital cultural and economic heritage. The AI Pricing Assistant guarantees that craftsmen charge living wages for physical labor hours, ensuring long-term workshop sustainability.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-[#D5C7B6]">
            <div className="w-8 h-8 rounded-lg bg-[#EAE2D3] text-[#654E3C] flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-[#423023]">
                Ethical & Transparent AI Innovation
              </h5>
              <p className="text-xs text-[#715E4E] mt-0.5 leading-relaxed">
                CraftCopy transparently highlights whether marketing content was generated via real-time cloud AI (Gemini 3.8 Flash) or offline simulated local synthesis, respecting maker integrity.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#4E654E] text-white text-xs font-bold hover:bg-[#3E523E] transition-all shadow-xs"
          >
            Back to CraftCopy
          </button>
        </div>
      </div>
    </div>
  );
};
