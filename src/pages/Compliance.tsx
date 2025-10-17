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
import { CheckSquare, Clock, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { NewComplianceDialog } from "@/components/forms/NewComplianceDialog";

const Compliance = () => {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequirements();
  }, []);

  const fetchRequirements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("compliance_requirements")
      .select("*, profiles(full_name)")
      .order("due_date", { ascending: true });

    if (data) setRequirements(data);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-gray-100 text-gray-800",
      "in-progress": "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      overdue: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={variants[status] || variants.pending}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
      </Badge>
    );
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "completed") return false;
    return new Date(dueDate) < new Date();
  };

  const completedCount = requirements.filter((r) => r.status === "completed").length;
  const overdueCount = requirements.filter((r) => isOverdue(r.due_date, r.status)).length;
  const complianceRate = requirements.length > 0 ? (completedCount / requirements.length) * 100 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Compliance Module</h2>
            <p className="text-muted-foreground">
              PENCOM Regulatory Requirements and Reporting Management
            </p>
          </div>
          <NewComplianceDialog onSuccess={fetchRequirements} />
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requirements</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{requirements.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(complianceRate)}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <Clock className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Requirements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Regulatory Requirements Register</CardTitle>
            <CardDescription>
              PENCOM, NDPA, and statutory compliance tracking with evidence management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Due Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Loading compliance requirements...
                    </TableCell>
                  </TableRow>
                ) : requirements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No compliance requirements found. Add regulatory requirements to start tracking.
                    </TableCell>
                  </TableRow>
                ) : (
                  requirements.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-mono text-sm">{req.requirement_code}</TableCell>
                      <TableCell className="font-medium">{req.title}</TableCell>
                      <TableCell>{req.source}</TableCell>
                      <TableCell>{req.category}</TableCell>
                      <TableCell>
                        {isOverdue(req.due_date, req.status)
                          ? getStatusBadge("overdue")
                          : getStatusBadge(req.status)}
                      </TableCell>
                      <TableCell>{req.profiles?.full_name || "Unassigned"}</TableCell>
                      <TableCell>
                        {req.due_date ? (
                          <span
                            className={
                              isOverdue(req.due_date, req.status) ? "text-red-600 font-medium" : ""
                            }
                          >
                            {format(new Date(req.due_date), "MMM dd, yyyy")}
                          </span>
                        ) : (
                          "Not set"
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Compliance;
