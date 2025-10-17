import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPolicies: 0,
    totalRisks: 0,
    totalCompliance: 0,
    totalIncidents: 0,
    highRisks: 0,
    overdueCompliance: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [policies, risks, compliance, incidents] = await Promise.all([
        supabase.from("policies").select("*", { count: "exact", head: true }),
        supabase.from("risks").select("*"),
        supabase.from("compliance_requirements").select("*"),
        supabase.from("incidents").select("*", { count: "exact", head: true }),
      ]);

      const highRisks = risks.data?.filter((r) => r.risk_score >= 15).length || 0;
      const overdueCompliance =
        compliance.data?.filter(
          (c) => c.due_date && new Date(c.due_date) < new Date() && c.status !== "completed"
        ).length || 0;

      setStats({
        totalPolicies: policies.count || 0,
        totalRisks: risks.data?.length || 0,
        totalCompliance: compliance.data?.length || 0,
        totalIncidents: incidents.count || 0,
        highRisks,
        overdueCompliance,
      });
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Total Policies",
      value: stats.totalPolicies,
      description: "Active governance policies",
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Risks",
      value: stats.totalRisks,
      description: `${stats.highRisks} high severity`,
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Compliance Items",
      value: stats.totalCompliance,
      description: `${stats.overdueCompliance} overdue`,
      icon: CheckCircle2,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Incidents",
      value: stats.totalIncidents,
      description: "Total reported incidents",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-3xl font-bold tracking-tight">GRC Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time overview of your Governance, Risk, and Compliance status
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Compliance Rate
              </CardTitle>
              <CardDescription>Overall regulatory compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.totalCompliance > 0
                  ? Math.round(
                      ((stats.totalCompliance - stats.overdueCompliance) /
                        stats.totalCompliance) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Based on completed requirements
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Risk Exposure
              </CardTitle>
              <CardDescription>High-priority risks requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{stats.highRisks}</div>
              <p className="text-sm text-muted-foreground mt-2">
                Out of {stats.totalRisks} total risks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                Pending Actions
              </CardTitle>
              <CardDescription>Items requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.overdueCompliance}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Overdue compliance items
              </p>
            </CardContent>
          </Card>
        </div>

        {/* PENCOM Compliance Status */}
        <Card>
          <CardHeader>
            <CardTitle>PENCOM Compliance Status</CardTitle>
            <CardDescription>
              Adherence to Pension Reform Act 2014 and PENCOM Guidelines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                ICT Guidelines Compliant
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Audit Trail Active
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                RBAC Enabled
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Clock className="h-3 w-3 mr-1" />
                Investment Limits Monitored
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
