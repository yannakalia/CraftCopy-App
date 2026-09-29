import React, { useState } from 'react';
import { 
  User, 
  Store, 
  MapPin, 
  FileText, 
  DollarSign, 
  Sparkles, 
  Check, 
  X, 
  Save,
  RotateCcw
} from 'lucide-react';
import { ArtisanProfile } from '../types';

interface BasicInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ArtisanProfile;
  onSaveProfile: (profile: ArtisanProfile, applyToCurrentProduct?: boolean) => void;
}

export const BasicInfoModal: React.FC<BasicInfoModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const [formData, setFormData] = useState<ArtisanProfile>({ ...profile });
  const [justSaved, setJustSaved] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof ArtisanProfile, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (applyToProduct = false) => {
    onSaveProfile(formData, applyToProduct);
    setJustSaved(true);
    setTimeout(() => {
      setJustSaved(false);
      onClose();
    }, 1200);
  };

  const handleResetToSample = () => {
    setFormData({
      makerName: 'Elena Santos',
      studioName: 'Tala Artisan Workshop',
      craftSpecialty: 'Handcrafted Leather Goods, Handwoven Apparel & Crochet Craft',
      location: 'Marikina & Laguna, Philippines',
      bio: 'Independent maker dedicated to slow, sustainable artisanal craftsmanship. From vegetable-tanned leather goods to hand-crocheted pieces and heritage apparel, each creation honors mindful handwork and local livelihood.',
      instagramHandle: '@tala.artisan',
      websiteUrl: 'talaartisan.ph',
      defaultHourlyRate: 180,
      defaultOverheadRate: 50,
      standardMarginPercent: 30,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div 
        id="basic-info-modal"
        className="bg-[#FAF7F2] border border-[#E8DFD1] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-[#E8DFD1]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#4E654E] text-white flex items-center justify-center shadow-sm">
              <Store className="w-6 h-6 text-[#FAF7F2]" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B6544]">
                Maker Profile & Settings
              </span>
              <h3 className="text-lg sm:text-xl font-bold font-artisan text-[#423023]">
                Artisan Basic Information
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToSample}
              className="text-xs text-[#7A6655] hover:text-[#423023] underline flex items-center gap-1"
              title="Fill with example artisan data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Fill Sample</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#887463] hover:bg-[#EFE7DA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#735F4C]">
          Provide your basic studio information once. CraftCopy uses these details to auto-personalize your product stories, pricing formulas, and social media captions.
        </p>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* Row 1: Maker Name & Studio Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B] mb-1">
                Maker / Artisan Name <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="profile-maker-name"
                  placeholder="e.g. Elena Vance"
                  value={formData.makerName}
                  onChange={(e) => handleChange('makerName', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B] mb-1">
                Studio / Business Name <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]">
                  <Store className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="profile-studio-name"
                  placeholder="e.g. Pine & Clay Ceramics"
                  value={formData.studioName}
                  onChange={(e) => handleChange('studioName', e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Specialty & Workshop Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#6F5B4B] mb-1">
                Primary Craft Specialty / Medium
              </label>
              <input
                type="text"
                id="profile-craft-specialty"
                placeholder="e.g. Wheel-thrown stoneware & kitchenware"
                value={formData.craftSpecialty}
                onChange={(e) => handleChange('craftSpecialty', e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#6F5B4B] mb-1">
                Workshop Location / City
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]">
                  <MapPin className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  id="profile-location"
                  placeholder="e.g. Asheville, North Carolina"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E]"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Maker Bio & Brand Mission */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#6F5B4B]">
                Maker Bio & Brand Story
              </label>
              <span className="text-[11px] text-[#867362]">
                Woven into your captions & marketing pitches
              </span>
            </div>
            <textarea
              rows={3}
              id="profile-bio"
              placeholder="e.g. Crafting functional pottery inspired by slow mornings and natural textures. All pieces are thrown by hand in small batches with food-safe non-toxic glazes."
              value={formData.bio}
              onChange={(e) => handleChange('bio', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#D5C7B6] bg-white text-[#423023] text-sm focus:outline-none focus:ring-2 focus:ring-[#4E654E] placeholder:text-[#A89887]"
            />
          </div>

          {/* Row 4: Pricing Defaults (SDG 9 Living Wage) */}
          <div className="p-4 rounded-2xl bg-[#F6EFE3] border border-[#DECFB8] space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C59B3C]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#654E3C]">
                Pricing Defaults & Living Wage Baseline
              </h4>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-[#6F5B4B] font-semibold mb-1">
                  Target Hourly Wage (₱/hr)
                </label>
                <input
                  type="number"
                  min="50"
                  step="10"
                  value={formData.defaultHourlyRate}
                  onChange={(e) => handleChange('defaultHourlyRate', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023]"
                />
              </div>

              <div>
                <label className="block text-[#6F5B4B] font-semibold mb-1">
                  Avg Overhead (₱/unit)
                </label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={formData.defaultOverheadRate}
                  onChange={(e) => handleChange('defaultOverheadRate', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023]"
                />
              </div>

              <div>
                <label className="block text-[#6F5B4B] font-semibold mb-1">
                  Standard Margin (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="70"
                  step="5"
                  value={formData.standardMarginPercent}
                  onChange={(e) => handleChange('standardMarginPercent', Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#D5C7B6] bg-white text-[#423023]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-[#E8DFD1] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#7A6655]">
            {justSaved && (
              <span className="text-[#4E654E] font-bold flex items-center gap-1">
                <Check className="w-4 h-4" />
                Artisan information saved successfully!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-[#4E654E] text-[#3E523E] hover:bg-[#E7EFE6] text-xs font-semibold transition-all"
            >
              Save & Apply to Current Product
            </button>

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#4E654E] text-white text-xs font-bold hover:bg-[#3E523E] transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Basic Information</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
