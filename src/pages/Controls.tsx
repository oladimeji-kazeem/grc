import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Shield, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Controls() {
  const [controls, setControls] = useState<any[]>([]);
  const [mappings, setMappings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchControls();
    fetchMappings();
  }, []);

  const fetchControls = async () => {
    try {
      const { data, error } = await supabase
        .from("controls")
        .select(`
          *,
          owner:profiles(full_name)
        `)
        .order("control_code");

      if (error) throw error;
      setControls(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMappings = async () => {
    try {
      const { data, error } = await supabase
        .from("policy_control_mappings")
        .select(`
          *,
          policy:policies(title),
          control:controls(control_code, title)
        `);

      if (error) throw error;
      setMappings(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getControlTypeColor = (type: string) => {
    switch (type) {
      case "preventive":
        return "bg-blue-500";
      case "detective":
        return "bg-yellow-500";
      case "corrective":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === "active" ? "default" : "secondary";
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Control Library</h1>
            <p className="text-muted-foreground">
              Manage controls and map them to policies
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Control
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Controls</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{controls.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Preventive</CardTitle>
              <Shield className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {controls.filter((c) => c.control_type === "preventive").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detective</CardTitle>
              <Shield className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {controls.filter((c) => c.control_type === "detective").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Policy Mappings</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mappings.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="controls" className="space-y-4">
          <TabsList>
            <TabsTrigger value="controls">Controls</TabsTrigger>
            <TabsTrigger value="mappings">Policy Mappings</TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Control Library</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Control Code</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : controls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No controls found
                        </TableCell>
                      </TableRow>
                    ) : (
                      controls.map((control) => (
                        <TableRow key={control.id}>
                          <TableCell className="font-medium">
                            {control.control_code}
                          </TableCell>
                          <TableCell>{control.title}</TableCell>
                          <TableCell>{control.category}</TableCell>
                          <TableCell>
                            <Badge className={getControlTypeColor(control.control_type)}>
                              {control.control_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{control.owner?.full_name || "N/A"}</TableCell>
                          <TableCell>{getStatusBadge(control.status)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mappings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Policy-Control Mappings</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Policy</TableHead>
                      <TableHead>Control Code</TableHead>
                      <TableHead>Control Title</TableHead>
                      <TableHead>Mapped Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mappings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center">
                          No mappings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      mappings.map((mapping) => (
                        <TableRow key={mapping.id}>
                          <TableCell>{mapping.policy?.title || "N/A"}</TableCell>
                          <TableCell className="font-medium">
                            {mapping.control?.control_code || "N/A"}
                          </TableCell>
                          <TableCell>{mapping.control?.title || "N/A"}</TableCell>
                          <TableCell>
                            {new Date(mapping.created_at).toLocaleDateString()}
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
      </div>
    </DashboardLayout>
  );
}
