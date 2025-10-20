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
import { FileText, Eye, Link2, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { NewPolicyDialog } from "@/components/forms/NewPolicyDialog";
import { useToast } from "@/hooks/use-toast";

const Governance = () => {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mappingPolicy, setMappingPolicy] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("policies")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false });

    if (data) setPolicies(data);
    setLoading(false);
  };

  const autoMapToRegulations = async (policyId: string) => {
    setMappingPolicy(policyId);
    try {
      const { data, error } = await supabase.functions.invoke("auto-map-regulations", {
        body: { policyId }
      });

      if (error) throw error;

      toast({
        title: "Auto-Mapping Complete",
        description: `${data.mappings.length} regulation mappings created`,
      });
    } catch (error) {
      console.error("Error auto-mapping:", error);
      toast({
        title: "Mapping Failed",
        description: error instanceof Error ? error.message : "Failed to auto-map regulations",
        variant: "destructive",
      });
    } finally {
      setMappingPolicy(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      draft: "bg-gray-100 text-gray-800",
      review: "bg-blue-100 text-blue-800",
      approved: "bg-green-100 text-green-800",
      archived: "bg-red-100 text-red-800",
    };

    return (
      <Badge className={variants[status] || variants.draft}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Governance Module</h2>
            <p className="text-muted-foreground">
              Central Policy Hub and Board Oversight Management
            </p>
          </div>
          <NewPolicyDialog onSuccess={fetchPolicies} />
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Policies</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{policies.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <FileText className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {policies.filter((p) => p.status === "approved").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <FileText className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {policies.filter((p) => p.status === "review" || p.status === "draft").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Policies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Policy Repository</CardTitle>
            <CardDescription>
              All governance policies with version control and approval tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Review Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      Loading policies...
                    </TableCell>
                  </TableRow>
                ) : policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No policies found. Create your first policy to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">{policy.title}</TableCell>
                      <TableCell>{policy.category}</TableCell>
                      <TableCell>{policy.version}</TableCell>
                      <TableCell>{getStatusBadge(policy.status)}</TableCell>
                      <TableCell>{policy.profiles?.full_name || "Unassigned"}</TableCell>
                      <TableCell>
                        {policy.review_date
                          ? format(new Date(policy.review_date), "MMM dd, yyyy")
                          : "Not set"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => autoMapToRegulations(policy.id)}
                            disabled={mappingPolicy === policy.id}
                          >
                            {mappingPolicy === policy.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Link2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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

export default Governance;
