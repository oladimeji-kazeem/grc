import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Risk {
  id: string;
  title: string;
  likelihood: number;
  impact: number;
  category: string;
}

interface RiskHeatmapProps {
  risks: Risk[];
}

export const RiskHeatmap = ({ risks }: RiskHeatmapProps) => {
  const getColorForScore = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    if (score >= 20) return "bg-red-500";
    if (score >= 12) return "bg-orange-500";
    if (score >= 6) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getRiskCountInCell = (likelihood: number, impact: number) => {
    return risks.filter(
      (r) => r.likelihood === likelihood && r.impact === impact
    ).length;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Heat Map</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>Low Impact →</span>
            <span>← High Impact</span>
          </div>
          
          <div className="grid grid-cols-6 gap-1">
            {/* Header row */}
            <div className="text-xs font-medium text-center p-2"></div>
            {[1, 2, 3, 4, 5].map((impact) => (
              <div key={impact} className="text-xs font-medium text-center p-2">
                {impact}
              </div>
            ))}
            
            {/* Grid rows */}
            {[5, 4, 3, 2, 1].map((likelihood) => (
              <>
                <div key={`label-${likelihood}`} className="text-xs font-medium flex items-center justify-center p-2">
                  {likelihood}
                </div>
                {[1, 2, 3, 4, 5].map((impact) => {
                  const count = getRiskCountInCell(likelihood, impact);
                  return (
                    <div
                      key={`${likelihood}-${impact}`}
                      className={`${getColorForScore(
                        likelihood,
                        impact
                      )} h-16 flex items-center justify-center text-white font-bold rounded cursor-pointer hover:opacity-80 transition-opacity`}
                      title={`${count} risk(s) - Likelihood: ${likelihood}, Impact: ${impact}`}
                    >
                      {count > 0 ? count : ""}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
            <span>Low Likelihood ↑</span>
            <span>↓ High Likelihood</span>
          </div>

          <div className="flex items-center gap-4 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Low (1-5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Medium (6-11)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>High (12-19)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Critical (20-25)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
