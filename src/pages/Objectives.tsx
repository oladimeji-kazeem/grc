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
import { Target, TrendingUp } from "lucide-react";
import { NewObjectiveDialog } from "@/components/forms/NewObjectiveDialog";

const Objectives = () => {
  const [objectives, setObjectives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchObjectives();
  }, []);

  const fetchObjectives = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("corporate_objectives")
      .select("*, owner:profiles(full_name), risks(count)")
      .order("created_at", { ascending: false });

    if (data) setObjectives(data);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      on_hold: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={variants[status] || variants.active}>
        {status.replace("_", " ").charAt(0).toUpperCase() + status.slice(1).replace("_", " ")}
      </Badge>
    );
  };

  const activeObjectives = objectives.filter((o) => o.status === "active").length;
  const completedObjectives = objectives.filter((o) => o.status === "completed").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Corporate Objectives</h2>
            <p className="text-muted-foreground">
              Strategic goals and departmental objectives linked to risk management
            </p>
          </div>
          <NewObjectiveDialog onSuccess={fetchObjectives} />
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{objectives.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeObjectives}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Target className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{completedObjectives}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Linked Risks</CardTitle>
              <Target className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {objectives.reduce((acc, obj) => acc + (obj.risks?.[0]?.count || 0), 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Objectives Table */}
        <Card>
          <CardHeader>
            <CardTitle>Strategic Objectives Register</CardTitle>
            <CardDescription>
              Organization-wide goals and departmental objectives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objective Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Fiscal Year</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Linked Risks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      Loading objectives...
                    </TableCell>
                  </TableRow>
                ) : objectives.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No objectives defined yet. Create your first objective to begin.
                    </TableCell>
                  </TableRow>
                ) : (
                  objectives.map((objective) => (
                    <TableRow key={objective.id}>
                      <TableCell className="font-medium">{objective.title}</TableCell>
                      <TableCell>{objective.department}</TableCell>
                      <TableCell>{objective.owner?.full_name || "Unassigned"}</TableCell>
                      <TableCell>{objective.fiscal_year}</TableCell>
                      <TableCell>{getStatusBadge(objective.status)}</TableCell>
                      <TableCell>{objective.risks?.[0]?.count || 0}</TableCell>
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

export default Objectives;
