import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, TrendingUp } from "lucide-react";
import { NewRiskDialog } from "@/components/forms/NewRiskDialog";

const Risk = () => {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("risks")
      .select("*, profiles(full_name)")
      .order("risk_score", { ascending: false });

    if (data) setRisks(data);
    setLoading(false);
  };

  const getRiskLevel = (score: number) => {
    if (score >= 15) return { label: "Critical", color: "bg-red-100 text-red-800" };
    if (score >= 10) return { label: "High", color: "bg-orange-100 text-orange-800" };
    if (score >= 5) return { label: "Medium", color: "bg-yellow-100 text-yellow-800" };
    return { label: "Low", color: "bg-green-100 text-green-800" };
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: "bg-blue-100 text-blue-800",
      mitigating: "bg-yellow-100 text-yellow-800",
      closed: "bg-green-100 text-green-800",
      monitoring: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge className={variants[status] || variants.open}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const criticalRisks = risks.filter((r) => r.risk_score >= 15).length;
  const highRisks = risks.filter((r) => r.risk_score >= 10 && r.risk_score < 15).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Risk Management Module</h2>
            <p className="text-muted-foreground">
              Enterprise Risk Register and Control Assurance
            </p>
          </div>
          <NewRiskDialog onSuccess={fetchRisks} />
        </div>

        {/* Overview Cards */}
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
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalRisks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{highRisks}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Mitigation</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {risks.filter((r) => r.status === "mitigating").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Risk Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Enterprise Risk Register</CardTitle>
            <CardDescription>
              Comprehensive risk assessment with likelihood and impact scoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Risk Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Likelihood</TableHead>
                  <TableHead>Impact</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading risks...
                    </TableCell>
                  </TableRow>
                ) : risks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No risks identified yet. Register your first risk to begin tracking.
                    </TableCell>
                  </TableRow>
                ) : (
                  risks.map((risk) => {
                    const riskLevel = getRiskLevel(risk.risk_score);
                    return (
                      <TableRow key={risk.id}>
                        <TableCell className="font-medium">{risk.title}</TableCell>
                        <TableCell>{risk.category}</TableCell>
                        <TableCell>{risk.likelihood}/5</TableCell>
                        <TableCell>{risk.impact}/5</TableCell>
                        <TableCell>
                          <span className="font-bold">{risk.risk_score}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={riskLevel.color}>{riskLevel.label}</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(risk.status)}</TableCell>
                        <TableCell>{risk.profiles?.full_name || "Unassigned"}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Risk;
