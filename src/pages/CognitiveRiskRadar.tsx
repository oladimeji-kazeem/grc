import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Brain, Loader2, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CognitiveRiskRadar = () => {
  const [risks, setRisks] = useState<any[]>([]);
  const [analysisType, setAnalysisType] = useState<string>("comprehensive");
  const [analysis, setAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    const { data } = await supabase
      .from("risks")
      .select("*")
      .order("risk_score", { ascending: false });
    
    if (data) setRisks(data);
  };

  const analyzeRisks = async (type: string) => {
    setIsAnalyzing(true);
    setAnalysisType(type);
    
    try {
      const { data, error } = await supabase.functions.invoke("cognitive-risk-analysis", {
        body: { riskData: risks, analysisType: type }
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Cognitive risk analysis has been generated",
      });
    } catch (error) {
      console.error("Error analyzing risks:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to generate analysis",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Cognitive Risk Radar</h2>
            <p className="text-muted-foreground">
              AI-powered risk intelligence and pattern analysis
            </p>
          </div>
          <Brain className="h-8 w-8 text-primary" />
        </div>

        {/* Analysis Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Intelligence Analysis</CardTitle>
            <CardDescription>
              Generate AI-powered insights from your risk data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={() => analyzeRisks("comprehensive")}
                disabled={isAnalyzing || risks.length === 0}
                variant={analysisType === "comprehensive" ? "default" : "outline"}
              >
                {isAnalyzing && analysisType === "comprehensive" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <TrendingUp className="mr-2 h-4 w-4" />
                Comprehensive Analysis
              </Button>
              <Button
                onClick={() => analyzeRisks("patterns")}
                disabled={isAnalyzing || risks.length === 0}
                variant={analysisType === "patterns" ? "default" : "outline"}
              >
                {isAnalyzing && analysisType === "patterns" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Target className="mr-2 h-4 w-4" />
                Pattern Detection
              </Button>
              <Button
                onClick={() => analyzeRisks("emerging")}
                disabled={isAnalyzing || risks.length === 0}
                variant={analysisType === "emerging" ? "default" : "outline"}
              >
                {isAnalyzing && analysisType === "emerging" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <AlertTriangle className="mr-2 h-4 w-4" />
                Emerging Threats
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Risk Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Risks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{risks.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Risks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {risks.filter(r => r.risk_score >= 15).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Risks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {risks.filter(r => r.risk_score >= 10 && r.risk_score < 15).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Risk Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {risks.length > 0
                  ? (risks.reduce((sum, r) => sum + r.risk_score, 0) / risks.length).toFixed(1)
                  : "0"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Results */}
        {analysis && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI-Powered Risk Intelligence
                  </CardTitle>
                  <CardDescription>
                    Generated using advanced cognitive analysis
                  </CardDescription>
                </div>
                <Badge variant="outline" className="capitalize">{analysisType}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <Textarea
                  value={analysis}
                  readOnly
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Distribution by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution Analysis</CardTitle>
            <CardDescription>Breakdown of risks by category and severity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {["Strategic", "Financial", "Operational", "Compliance", "IT Security", "Reputational"].map((category) => {
                const categoryRisks = risks.filter(r => r.category === category);
                const criticalCount = categoryRisks.filter(r => r.risk_score >= 15).length;
                const highCount = categoryRisks.filter(r => r.risk_score >= 10 && r.risk_score < 15).length;

                return categoryRisks.length > 0 ? (
                  <div key={category} className="p-4 border rounded-lg bg-card">
                    <h4 className="font-semibold mb-2">{category}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{categoryRisks.length}</span>
                      </div>
                      {criticalCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-red-600">Critical:</span>
                          <span className="font-medium text-red-600">{criticalCount}</span>
                        </div>
                      )}
                      {highCount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-orange-600">High:</span>
                          <span className="font-medium text-orange-600">{highCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CognitiveRiskRadar;
