import { Card, CardTitle, CardValue } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign } from "lucide-react";

interface PipelineCardProps {
  sellerLeads: number;
  buyerLeads: number;
  estimatedPipeline: number;
}

export function PipelineCard({
  sellerLeads,
  buyerLeads,
  estimatedPipeline,
}: PipelineCardProps) {
  const totalActive = sellerLeads + buyerLeads;

  return (
    <Card className="bg-neutral-900 text-white border-neutral-800">
      <div className="flex items-start justify-between">
        <CardTitle className="text-neutral-400">Est. Commission Pipeline</CardTitle>
        <DollarSign className="w-5 h-5 text-neutral-500" />
      </div>
      <CardValue className="text-white">
        {formatCurrency(estimatedPipeline)}
      </CardValue>
      <p className="text-xs text-neutral-400 mt-2">
        Based on {totalActive} active leads at 3% conversion and 3% commission
      </p>
    </Card>
  );
}
