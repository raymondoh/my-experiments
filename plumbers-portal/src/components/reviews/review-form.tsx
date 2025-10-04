// src/components/reviews/review-form.tsx

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Star } from "lucide-react";

interface ReviewFormProps {
  jobId: string;
  tradespersonId?: string;
}

export default function ReviewForm({ jobId, tradespersonId }: ReviewFormProps) {
  const router = useRouter(); // <-- 2. Initialize the router
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradespersonId) {
      toast.error("No tradesperson assigned to this job.");
      return;
    }
    setLoading(true);
    try {
      let googleReviewUrl: string | null | undefined;
      try {
        const tradespersonRes = await fetch(`/api/user/${tradespersonId}`);
        if (tradespersonRes.ok) {
          const tradespersonData = await tradespersonRes.json();
          googleReviewUrl = tradespersonData.user?.googleBusinessProfileUrl;
        }
      } catch (error) {
        console.error("[v0] Failed to fetch tradesperson data for Google review URL:", error);
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, tradespersonId, rating, comment })
      });
      if (res.ok) {
        let redirectUrl = `/dashboard/customer/jobs/${jobId}?review_submitted=true`;
        if (googleReviewUrl) {
          redirectUrl += `&google_review_url=${encodeURIComponent(googleReviewUrl)}`;
        }
        router.push(redirectUrl);
      } else {
        toast.error("Failed to submit review");
      }
    } catch (error) {
      console.error("[v0] Failed to submit review:", error);
      toast.error("Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      {/* ... form JSX remains the same ... */}
      <div>
        <Label htmlFor="rating">Rating</Label>
        <div className="flex gap-1 mt-1" id="rating">
          {[1, 2, 3, 4, 5].map(star => (
            <Star
              key={star}
              className={
                "h-6 w-6 cursor-pointer " + (star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")
              }
              onClick={() => setRating(star)}
              data-testid={`star-${star}`}
            />
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="comment">Review</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Describe your experience"
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
