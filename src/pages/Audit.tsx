import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { NewIncidentDialog } from "@/components/forms/NewIncidentDialog";

const Audit = () => {
  const [risks, setRisks] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    setLoading(true);
    
    const [risksData, incidentsData, logsData] = await Promise.all([
      supabase
        .from("risks")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("incidents")
        .select("*")
        .order("reported_at", { ascending: false }),
      supabase
        .from("audit_logs")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(50),
    ]);

    if (risksData.data) setRisks(risksData.data);
    if (incidentsData.data) setIncidents(incidentsData.data);
    if (logsData.data) setAuditLogs(logsData.data);
    
    setLoading(false);
  };

  const handleFlagForReview = async (riskId: string) => {
    const { error } = await supabase
      .from("risks")
      .update({ status: "monitoring" })
      .eq("id", riskId);

    if (!error) {
      toast({
        title: "Risk Flagged",
        description: "Risk has been flagged for continuous monitoring",
      });
      fetchAuditData();
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    const { error } = await supabase
      .from("incidents")
      .update({ 
        status: "resolved",
        resolved_at: new Date().toISOString()
      })
      .eq("id", incidentId);

    if (!error) {
      toast({
        title: "Incident Resolved",
        description: "Incident has been marked as resolved",
      });
      fetchAuditData();
    }
  };

  const getRiskStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      open: "bg-red-100 text-red-800",
      mitigating: "bg-yellow-100 text-yellow-800",
      closed: "bg-green-100 text-green-800",
      monitoring: "bg-blue-100 text-blue-800",
    };

    return (
      <Badge className={variants[status] || variants.open}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getIncidentStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      reported: { color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
      investigating: { color: "bg-blue-100 text-blue-800", icon: Clock },
      resolved: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      closed: { color: "bg-gray-100 text-gray-800", icon: XCircle },
    };

    const config = variants[status] || variants.reported;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-white",
      low: "bg-green-500 text-white",
    };

    return (
      <Badge className={colors[severity] || colors.medium}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const openRisks = risks.filter(r => r.status === "open").length;
  const criticalRisks = risks.filter(r => r.risk_score >= 15).length;
  const pendingIncidents = incidents.filter(i => i.status !== "resolved" && i.status !== "closed").length;
  const criticalIncidents = incidents.filter(i => i.severity === "critical").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Audit & Risk Monitoring</h2>
            <p className="text-muted-foreground">
              Internal and external audit oversight of risk and incident management
            </p>
          </div>
          <NewIncidentDialog onSuccess={fetchAuditData} />
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Risks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openRisks}</div>
              <p className="text-xs text-muted-foreground">
                {criticalRisks} critical priority
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingIncidents}</div>
              <p className="text-xs text-muted-foreground">
                {criticalIncidents} critical severity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Audit Findings</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{auditLogs.length}</div>
              <p className="text-xs text-muted-foreground">Recent audit activities</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {incidents.length > 0
                  ? Math.round((incidents.filter(i => i.status === "resolved").length / incidents.length) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Incident resolution</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different audit views */}
        <Tabs defaultValue="risks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="risks">Risk Monitoring</TabsTrigger>
            <TabsTrigger value="incidents">Incident Management</TabsTrigger>
            <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
          </TabsList>

          {/* Risk Monitoring Tab */}
          <TabsContent value="risks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Register - Audit Oversight</CardTitle>
                <CardDescription>
                  Monitor and enforce resolution of identified risks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Risk Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Risk Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Loading risks...
                        </TableCell>
                      </TableRow>
                    ) : risks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No risks to monitor
                        </TableCell>
                      </TableRow>
                    ) : (
                      risks.map((risk) => (
                        <TableRow key={risk.id}>
                          <TableCell className="font-medium">{risk.title}</TableCell>
                          <TableCell>{risk.category}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${
                              risk.risk_score >= 15 ? "text-red-600" :
                              risk.risk_score >= 10 ? "text-orange-600" :
                              risk.risk_score >= 5 ? "text-yellow-600" :
                              "text-green-600"
                            }`}>
                              {risk.risk_score}
                            </span>
                          </TableCell>
                          <TableCell>{getRiskStatusBadge(risk.status)}</TableCell>
                          <TableCell>
                            <Badge className={
                              risk.approval_status === "approved" ? "bg-green-100 text-green-800" :
                              risk.approval_status === "rejected" ? "bg-red-100 text-red-800" :
                              "bg-yellow-100 text-yellow-800"
                            }>
                              {risk.approval_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {risk.status === "open" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFlagForReview(risk.id)}
                              >
                                <Shield className="h-4 w-4 mr-1" />
                                Flag for Review
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Incident Management Tab */}
          <TabsContent value="incidents" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Incident Management Workflow</CardTitle>
                <CardDescription>
                  Track and resolve risk incidents across the organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incident Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Reported</TableHead>
                      <TableHead>Resolved</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Loading incidents...
                        </TableCell>
                      </TableRow>
                    ) : incidents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No incidents reported
                        </TableCell>
                      </TableRow>
                    ) : (
                      incidents.map((incident) => (
                        <TableRow key={incident.id}>
                          <TableCell className="font-medium">{incident.title}</TableCell>
                          <TableCell>{getSeverityBadge(incident.severity)}</TableCell>
                          <TableCell>{getIncidentStatusBadge(incident.status)}</TableCell>
                          <TableCell>
                            {new Date(incident.reported_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {incident.resolved_at 
                              ? new Date(incident.resolved_at).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {incident.status !== "resolved" && incident.status !== "closed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleResolveIncident(incident.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                                Resolve
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Trail Tab */}
          <TabsContent value="audit-trail" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>
                  Complete audit log of all GRC activities and changes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Entity Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          Loading audit logs...
                        </TableCell>
                      </TableRow>
                    ) : auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No audit logs available
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.timestamp).toLocaleString()}
                          </TableCell>
                          <TableCell>{log.user_email || "System"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.entity_type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge>{log.action}</Badge>
                          </TableCell>
                          <TableCell className="max-w-md truncate">
                            {log.details ? JSON.stringify(log.details) : "-"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Audit Committee Reporting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Board Audit Committee Report
            </CardTitle>
            <CardDescription>
              Summary for Board Audit Committee oversight
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Total Risks Under Review</p>
                <p className="text-2xl font-bold">{risks.length}</p>
                <p className="text-xs text-muted-foreground">
                  {criticalRisks} require immediate attention
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Incidents This Period</p>
                <p className="text-2xl font-bold">{incidents.length}</p>
                <p className="text-xs text-muted-foreground">
                  {pendingIncidents} awaiting resolution
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Audit Activities</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
                <p className="text-xs text-muted-foreground">
                  Recent audit trail entries
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Audit;
