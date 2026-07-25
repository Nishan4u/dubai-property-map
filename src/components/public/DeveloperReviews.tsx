"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { DeveloperReviewRow } from "@/types/database";

export function DeveloperReviews({
  developerId,
  initialReviews,
}: {
  developerId: string;
  initialReviews: DeveloperReviewRow[];
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const myReview = reviews.find((r) => r.user_id === userId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setStatus("saving");
    const supabase = createClient();
    const { data, error } = await supabase
      .from("developer_reviews")
      .upsert(
        { developer_id: developerId, user_id: userId, rating, comment },
        { onConflict: "developer_id,user_id" }
      )
      .select()
      .single();

    if (error || !data) {
      setStatus("error");
      return;
    }
    setReviews((prev) => [data, ...prev.filter((r) => r.user_id !== userId)]);
    setStatus("idle");
    setComment("");
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              className={`h-4 w-4 ${
                n <= Math.round(avg)
                  ? "fill-gold-400 text-gold-400"
                  : "text-navy-600"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-ink-100">
          {avg > 0 ? avg.toFixed(1) : "No ratings yet"}
        </span>
        <span className="text-xs text-ink-500">
          ({reviews.length} review{reviews.length === 1 ? "" : "s"})
        </span>
      </div>

      {userId ? (
        <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-navy-700 bg-navy-900 p-4">
          <p className="mb-2 text-xs font-medium text-ink-400">
            {myReview ? "Update your review" : "Write a review"}
          </p>
          <div className="mb-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="p-0.5"
              >
                <Star
                  className={`h-5 w-5 ${
                    n <= rating ? "fill-gold-400 text-gold-400" : "text-navy-600"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this developer…"
            className="w-full rounded-lg border border-navy-600 bg-navy-800 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={status === "saving"}
            className="mt-2 rounded-lg bg-gold-500 px-4 py-1.5 text-xs font-semibold text-navy-950 hover:bg-gold-400 disabled:opacity-60"
          >
            {status === "saving" ? "Submitting…" : myReview ? "Update Review" : "Submit Review"}
          </button>
          {status === "error" && (
            <p className="mt-1 text-xs text-rose-400">Something went wrong.</p>
          )}
        </form>
      ) : (
        <p className="mt-3 text-xs text-ink-500">Log in to write a review.</p>
      )}

      <ul className="mt-4 space-y-3">
        {reviews
          .filter((r) => r.comment)
          .map((r) => (
            <li key={r.id} className="rounded-lg border border-navy-700 bg-navy-850 p-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`h-3.5 w-3.5 ${
                      n <= r.rating ? "fill-gold-400 text-gold-400" : "text-navy-600"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-sm text-ink-300">{r.comment}</p>
              <p className="mt-1 text-xs text-ink-600">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
      </ul>
    </div>
  );
}
