import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckIcon, StarIcon, TrendingUpIcon } from "lucide-react";

interface PricingPlan {
  name: string;
  price: number;
  popular?: boolean;
  features: string[];
  description: string;
  badge?: string;
}

interface PricingCardProps {
  plan: PricingPlan;
  selected?: boolean;
  onSelect: () => void;
}

export const PricingCard: React.FC<PricingCardProps> = ({ plan, selected, onSelect }) => {
  const isPopular = plan.popular;
  
  return (
    <Card 
      className={`relative p-6 cursor-pointer transition-all duration-300 hover:shadow-elegant ${
        isPopular ? 'ring-4 ring-ninja-blue bg-white shadow-elegant scale-[1.02]' : 'border border-gray-200'
      } ${
        selected 
          ? 'ring-2 ring-ninja-blue shadow-elegant scale-[1.02] bg-ninja-blue/5' 
          : 'hover:scale-[1.01] shadow-card'
      }`}
      onClick={onSelect}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-ninja-blue text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-lg">
            <TrendingUpIcon className="w-4 h-4" />
            RECOMMENDED
          </div>
        </div>
      )}

      <div className="text-center pt-3">
        <h3 className="text-xl font-bold text-foreground mb-3">{plan.name}</h3>
        <div className="mb-4">
          <span className="text-4xl font-extrabold text-ninja-blue">${plan.price}</span>
          <span className="text-muted-foreground text-base">/mo</span>
        </div>
        
        {/* Simplified feature list - only show 3 key features */}
        <div className="space-y-2 mb-6">
          {plan.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="flex items-center justify-center gap-2 text-sm">
              <CheckIcon className="w-4 h-4 text-ninja-blue flex-shrink-0" />
              <span className="text-foreground font-medium">{feature}</span>
            </div>
          ))}
          {plan.features.length > 3 && (
            <div className="text-xs text-muted-foreground mt-2">
              +{plan.features.length - 3} more features
            </div>
          )}
        </div>

        <Button 
          variant={selected ? "ninja" : "outline"} 
          size="lg" 
          className={`w-full font-bold ${isPopular ? 'ring-2 ring-ninja-blue/30' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {selected ? '✓ Selected' : 'Choose Plan'}
        </Button>
      </div>
    </Card>
  );
};