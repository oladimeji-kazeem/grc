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
import { AlertTriangle, TrendingUp, CheckCircle, XCircle, Clock } from "lucide-react";
import { NewRiskDialog } from "@/components/forms/NewRiskDialog";
import { useToast } from "@/hooks/use-toast";

const Risk = () => {
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRisks();
  }, []);

  const fetchRisks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("risks")
      .select(`
        *, 
        owner:profiles!risks_owner_id_fkey(full_name),
        champion:profiles!risks_risk_champion_id_fkey(full_name),
        approver:profiles!risks_approved_by_fkey(full_name),
        objective:corporate_objectives(title, department)
      `)
      .order("risk_score", { ascending: false });

    if (data) setRisks(data);
    setLoading(false);
  };

  const handleApproveRisk = async (riskId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("risks")
      .update({
        approval_status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", riskId);

    if (!error) {
      toast({
        title: "Success",
        description: "Risk approved successfully",
      });
      fetchRisks();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve risk",
      });
    }
  };

  const handleRejectRisk = async (riskId: string) => {
    const { error } = await supabase
      .from("risks")
      .update({ approval_status: "rejected" })
      .eq("id", riskId);

    if (!error) {
      toast({
        title: "Success",
        description: "Risk rejected",
      });
      fetchRisks();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject risk",
      });
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 15) return { label: "Critical", color: "bg-red-500 text-white" };
    if (score >= 10) return { label: "High", color: "bg-orange-500 text-white" };
    if (score >= 5) return { label: "Medium", color: "bg-yellow-500 text-white" };
    return { label: "Low", color: "bg-green-500 text-white" };
  };

  const getApprovalBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock },
      approved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      rejected: { color: "bg-red-100 text-red-800", icon: XCircle },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
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
  const pendingApproval = risks.filter((r) => r.approval_status === "pending").length;

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
        <div className="grid gap-4 md:grid-cols-5">
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
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{pendingApproval}</div>
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
                  <TableHead>Objective</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      Loading risks...
                    </TableCell>
                  </TableRow>
                ) : risks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">
                      No risks identified yet. Register your first risk to begin tracking.
                    </TableCell>
                  </TableRow>
                ) : (
                  risks.map((risk) => {
                    const riskLevel = getRiskLevel(risk.risk_score);
                    return (
                      <TableRow key={risk.id}>
                        <TableCell className="font-medium">{risk.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{risk.category}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {risk.objective ? (
                            <div>
                              <div>{risk.objective.title}</div>
                              <div className="text-muted-foreground">{risk.objective.department}</div>
                            </div>
                          ) : (
                            "Not linked"
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="font-bold">{risk.risk_score}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={riskLevel.color}>{riskLevel.label}</Badge>
                        </TableCell>
                        <TableCell>{getApprovalBadge(risk.approval_status)}</TableCell>
                        <TableCell>{getStatusBadge(risk.status)}</TableCell>
                        <TableCell>{risk.owner?.full_name || "Unassigned"}</TableCell>
                        <TableCell>
                          {risk.objective?.department || risk.owner?.department || "N/A"}
                        </TableCell>
                        <TableCell>
                          {risk.approval_status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => handleApproveRisk(risk.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8"
                                onClick={() => handleRejectRisk(risk.id)}
                              >
                                <XCircle className="h-4 w-4 mr-1 text-red-600" />
                                Reject
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Board Risk Committee Report */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Board Risk Committee Report
            </CardTitle>
            <CardDescription>
              Executive summary for Board Risk Committee oversight and governance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Risks Under Review</p>
                <p className="text-3xl font-bold">{risks.length}</p>
                <p className="text-xs text-muted-foreground">
                  Across all departments and categories
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Critical & High Risks</p>
                <p className="text-3xl font-bold text-red-600">{criticalRisks + highRisks}</p>
                <p className="text-xs text-muted-foreground">
                  {criticalRisks} critical, {highRisks} high priority
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-3xl font-bold text-yellow-600">{pendingApproval}</p>
                <p className="text-xs text-muted-foreground">
                  Awaiting department head approval
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Risk Mitigation Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {risks.length > 0
                    ? Math.round((risks.filter(r => r.status === "mitigating" || r.status === "monitoring" || r.status === "closed").length / risks.length) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Risks being actively managed
                </p>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-4">Risk Distribution by Category</h4>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                {["Strategic", "Financial", "Operational", "Compliance", "IT Security", "Investment", "Reputational"].map((category) => {
                  const categoryRisks = risks.filter(r => r.category === category);
                  const categoryCount = categoryRisks.length;
                  const criticalInCategory = categoryRisks.filter(r => r.risk_score >= 15).length;
                  
                  return categoryCount > 0 ? (
                    <div key={category} className="p-3 border rounded-lg bg-muted/30">
                      <p className="text-sm font-medium">{category}</p>
                      <p className="text-2xl font-bold mt-1">{categoryCount}</p>
                      {criticalInCategory > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          {criticalInCategory} critical
                        </p>
                      )}
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-semibold mb-3">Key Risk Indicators (KRIs)</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-5 w-5 ${criticalRisks > 0 ? "text-red-600" : "text-green-600"}`} />
                    <div>
                      <p className="text-sm font-medium">Critical Risk Threshold</p>
                      <p className="text-xs text-muted-foreground">Risks with score ≥ 15</p>
                    </div>
                  </div>
                  <Badge className={criticalRisks > 0 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                    {criticalRisks > 0 ? `${criticalRisks} Above Threshold` : "Within Limits"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className={`h-5 w-5 ${pendingApproval > 5 ? "text-yellow-600" : "text-green-600"}`} />
                    <div>
                      <p className="text-sm font-medium">Approval Backlog</p>
                      <p className="text-xs text-muted-foreground">Risks pending approval</p>
                    </div>
                  </div>
                  <Badge className={pendingApproval > 5 ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                    {pendingApproval > 5 ? `${pendingApproval} Pending` : "Under Control"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Risk Management Coverage</p>
                      <p className="text-xs text-muted-foreground">Risks with mitigation plans</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    {risks.length > 0
                      ? `${Math.round((risks.filter(r => r.mitigation_plan).length / risks.length) * 100)}% Coverage`
                      : "No Data"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Risk;
