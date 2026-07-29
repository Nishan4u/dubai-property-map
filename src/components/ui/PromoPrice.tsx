import { isPromoLive } from "@/lib/subscriptionStatus";

interface PromoPlan {
  price_label: string;
  promo_active?: boolean;
  promo_ends_at?: string | null;
  promo_price_label?: string | null;
}

export function PromoPrice({ plan }: { plan: PromoPlan }) {
  if (!isPromoLive(plan)) {
    return <p className="mt-1 text-xl font-bold text-ink-100">{plan.price_label}</p>;
  }
  return (
    <div className="mt-1">
      <p className="flex items-baseline gap-2">
        <span className="text-sm text-ink-500 line-through">{plan.price_label}</span>
        <span className="text-xl font-bold text-rose-400">{plan.promo_price_label}</span>
      </p>
      {plan.promo_ends_at && (
        <p className="text-[11px] font-medium text-rose-400/80">
          Offer ends {new Date(`${plan.promo_ends_at}T00:00:00Z`).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
