import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AIRecommendation {
  id: string;
  recommendation_type: string;
  title: string;
  description: string;
  rationale: string;
  confidence_score: number;
  priority: string;
  status: string;
}

interface AIRecommendationsProps {
  entityType: string;
  entityId: string;
}

export const AIRecommendations = ({ entityType, entityId }: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, [entityType, entityId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ai_recommendations")
      .select("*")
      .eq("entity_type", entityType)
      .eq("entity_id", entityId)
      .order("created_at", { ascending: false });

    if (data) setRecommendations(data);
    setLoading(false);
  };

  const generateRecommendations = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-recommendations", {
        body: {
          entityType,
          entityId,
          context: { timestamp: new Date().toISOString() }
        }
      });

      if (error) throw error;

      toast({
        title: "Recommendations Generated",
        description: `${data.recommendations.length} AI recommendations created`,
      });
      fetchRecommendations();
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate recommendations",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("ai_recommendations")
      .update({ status })
      .eq("id", id);

    if (!error) {
      fetchRecommendations();
      toast({
        title: "Status Updated",
        description: `Recommendation marked as ${status}`,
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800",
    };
    return colors[priority] || colors.medium;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Recommendations
            </CardTitle>
            <CardDescription>
              Explainable AI-powered recommendations for improvement
            </CardDescription>
          </div>
          <Button
            onClick={generateRecommendations}
            disabled={generating}
            size="sm"
          >
            {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Generate New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading recommendations...
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No recommendations yet. Click "Generate New" to get AI-powered insights.
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 border rounded-lg space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getPriorityColor(rec.priority)}>
                        {rec.priority}
                      </Badge>
                      <Badge variant="outline">
                        Confidence: {(rec.confidence_score * 100).toFixed(0)}%
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {rec.status}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-1">{rec.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                    <div className="bg-muted p-3 rounded text-sm">
                      <p className="font-medium mb-1">AI Rationale:</p>
                      <p className="text-muted-foreground">{rec.rationale}</p>
                    </div>
                  </div>
                </div>
                {rec.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(rec.id, "accepted")}
                    >
                      <CheckCircle className="mr-1 h-4 w-4 text-green-600" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(rec.id, "rejected")}
                    >
                      <XCircle className="mr-1 h-4 w-4 text-red-600" />
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
