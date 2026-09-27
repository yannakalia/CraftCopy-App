import { CostDetails } from '../types';

export interface PricingResult {
  totalCost: number;
  laborCost: number;
  minBreakeven: number;
  suggestedRetail: number;
  wholesale: number;
  profitMarginPercent: number;
  artisanProfitPerUnit: number;
  pricingTip: string;
  marketComparison: string;
}

export function calculateCraftPricing(
  cost: CostDetails,
  category: string,
  currentPrice: number | null
): PricingResult {
  const materials = Number(cost.materialsCost) || 0;
  const hours = Number(cost.laborHours) || 0;
  const rate = Number(cost.hourlyRate) || 0;
  const overhead = Number(cost.overheadCost) || 0;
  const marginPercent = Math.min(Math.max(Number(cost.targetMarginPercent) || 25, 5), 85);

  const laborCost = Math.round(hours * rate * 100) / 100;
  const totalCost = Math.round((materials + laborCost + overhead) * 100) / 100;

  // Formula standard for handmade artisan goods:
  // Base Breakeven = Total Cost
  // Wholesale = Total Cost * 2 (standard industry formula ensuring 50% wholesale margin)
  // Retail = Wholesale * 2 OR Total Cost / (1 - (Margin / 100))
  // We balance these two so craftsmen don't undercut their sustainability:
  const formulaRetail = totalCost > 0 ? totalCost / (1 - marginPercent / 100) : 0;
  const wholesaleCalculated = totalCost * 1.6;
  const standardRetail = Math.max(formulaRetail, wholesaleCalculated * 1.35);

  // Round to psychological artisan pricing in Pesos (multiples of 10 or 50)
  const suggestedRetail = Math.max(Math.round(standardRetail / 10) * 10, Math.ceil(totalCost + 50));
  const wholesale = Math.round((suggestedRetail * 0.55) / 10) * 10;
  const minBreakeven = Math.ceil(totalCost);
  const artisanProfitPerUnit = Math.round((suggestedRetail - totalCost) * 100) / 100;
  const actualProfitMargin = suggestedRetail > 0 ? Math.round((artisanProfitPerUnit / suggestedRetail) * 100) : 0;

  let pricingTip = `Honoring your ${hours}h of manual labor at ₱${rate}/hr ensures your craft remains financially sustainable rather than an expensive hobby.`;
  if (currentPrice && currentPrice < minBreakeven) {
    pricingTip = `⚠️ Your current price (₱${currentPrice.toLocaleString()}) is below your production cost (₱${minBreakeven.toLocaleString()}). Raising to ₱${suggestedRetail.toLocaleString()} prevents you from paying out of pocket to make this piece.`;
  } else if (currentPrice && currentPrice < suggestedRetail) {
    const diff = suggestedRetail - currentPrice;
    pricingTip = `Artisan opportunity: Buyers of authentic ${category.toLowerCase()} appreciate quality. Raising your price by ₱${diff.toLocaleString()} aligns with boutique markets and yields ₱${diff.toLocaleString()} extra pure profit per sale.`;
  } else if (currentPrice && currentPrice >= suggestedRetail) {
    pricingTip = `Your current price of ₱${currentPrice.toLocaleString()} is healthy! It supports fair wages and leaves headroom for wholesale galleries and craft fairs.`;
  }

  const marketComparison = `Independent artisan market benchmarks for ${category || 'handcrafted goods'} typically retail between ₱${Math.round((suggestedRetail * 0.85) / 10) * 10} and ₱${Math.round((suggestedRetail * 1.25) / 10) * 10} depending on provenance and story.`;

  return {
    totalCost,
    laborCost,
    minBreakeven,
    suggestedRetail,
    wholesale,
    profitMarginPercent: actualProfitMargin,
    artisanProfitPerUnit,
    pricingTip,
    marketComparison,
  };
}
