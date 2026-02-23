"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight } from "lucide-react";

interface LeadGateFormProps {
  realtorId: string;
  conversationId: string | null;
  onComplete: () => void;
  onSkip: () => void;
}

export function LeadGateForm({
  realtorId,
  conversationId,
  onComplete,
  onSkip,
}: LeadGateFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          conversationId,
          realtorId,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");

      onComplete();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-200">
      <p className="text-sm font-medium text-neutral-900 mb-1">
        Want personalized answers?
      </p>
      <p className="text-xs text-neutral-500 mb-3">
        Get tailored market insights and listings sent to your inbox.
      </p>

      <form onSubmit={handleSubmit} className="space-y-2">
        <Input
          type="text"
          placeholder="Your name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
        />
        <Input
          type="email"
          placeholder="Your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={!email.trim() || isSubmitting}
            size="sm"
            className="flex-1"
          >
            {isSubmitting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                Continue <ArrowRight className="w-3 h-3 ml-1" />
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSkip}
            disabled={isSubmitting}
          >
            Skip
          </Button>
        </div>
      </form>
    </div>
  );
}
