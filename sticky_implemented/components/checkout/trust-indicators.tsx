import { StarIcon, UsersIcon, ShieldCheckIcon, TrophyIcon } from "lucide-react";
export const TrustIndicators = () => {
  return <div className="space-y-6">
      {/* Star Rating */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex">
          {[...Array(5)].map((_, i) => <StarIcon key={i} className="w-5 h-5 fill-ninja-yellow text-ninja-yellow" />)}
        </div>
        <span className="font-medium text-foreground">Trusted by 15,000+ Businesses</span>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-white border-2 border-ninja-blue rounded-full flex items-center justify-center">
            <UsersIcon className="w-6 h-6 text-ninja-blue" />
          </div>
          <div>
            <div className="font-semibold text-foreground">15,000+</div>
            <div className="text-sm text-muted-foreground">Happy Customers</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-white border-2 border-ninja-blue rounded-full flex items-center justify-center">
            <TrophyIcon className="w-6 h-6 text-ninja-blue" />
          </div>
          <div>
            <div className="font-semibold text-foreground">#1 Rated</div>
            <div className="text-sm text-muted-foreground">AI Optimization</div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 bg-white border-2 border-ninja-blue rounded-full flex items-center justify-center">
            <ShieldCheckIcon className="w-6 h-6 text-ninja-blue" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Secure</div>
            <div className="text-sm text-muted-foreground">& Guaranteed</div>
          </div>
        </div>
      </div>

      {/* Money Back Guarantee */}
      <div className="bg-accent/50 rounded-lg p-4 text-center">
        <div className="font-semibold text-foreground mb-1">Rated the #1 small business AI boost service</div>
        <div className="text-sm text-muted-foreground">Take your business to the next level today</div>
      </div>
    </div>;
};