import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

const complianceSchema = z.object({
  requirement_code: z.string().trim().min(2, "Code must be at least 2 characters").max(50, "Code must be less than 50 characters"),
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional(),
  source: z.string().min(1, "Source is required"),
  category: z.string().min(1, "Category is required"),
  status: z.enum(["pending", "in-progress", "completed", "overdue"]),
  due_date: z.string().optional(),
  evidence_url: z.string().trim().url("Must be a valid URL").max(500, "URL must be less than 500 characters").optional().or(z.literal("")),
});

type ComplianceFormValues = z.infer<typeof complianceSchema>;

interface NewComplianceDialogProps {
  onSuccess: () => void;
}

export function NewComplianceDialog({ onSuccess }: NewComplianceDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<ComplianceFormValues>({
    resolver: zodResolver(complianceSchema),
    defaultValues: {
      requirement_code: "",
      title: "",
      description: "",
      source: "",
      category: "",
      status: "pending",
      due_date: "",
      evidence_url: "",
    },
  });

  const onSubmit = async (data: ComplianceFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to create a compliance requirement",
        });
        return;
      }

      const { error } = await supabase.from("compliance_requirements").insert({
        requirement_code: data.requirement_code,
        title: data.title,
        description: data.description || null,
        source: data.source,
        category: data.category,
        status: data.status,
        due_date: data.due_date || null,
        evidence_url: data.evidence_url || null,
        owner_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Compliance requirement created successfully",
      });

      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create compliance requirement",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Requirement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Compliance Requirement</DialogTitle>
          <DialogDescription>
            Add a new regulatory or statutory compliance requirement
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="requirement_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirement Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PEN-ICT-34" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PENCOM">PENCOM</SelectItem>
                        <SelectItem value="PRA 2014">PRA 2014</SelectItem>
                        <SelectItem value="NDPA">NDPA</SelectItem>
                        <SelectItem value="CBN">CBN</SelectItem>
                        <SelectItem value="FIRS">FIRS</SelectItem>
                        <SelectItem value="Internal">Internal</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirement Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Maintain Audit Trail of All System Activities" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Regulatory Reporting">Regulatory Reporting</SelectItem>
                      <SelectItem value="Investment Compliance">Investment Compliance</SelectItem>
                      <SelectItem value="ICT Governance">ICT Governance</SelectItem>
                      <SelectItem value="Risk Management">Risk Management</SelectItem>
                      <SelectItem value="AML/CFT">AML/CFT</SelectItem>
                      <SelectItem value="Data Protection">Data Protection</SelectItem>
                      <SelectItem value="Operational">Operational</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="evidence_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evidence URL</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed requirement description and compliance actions..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating..." : "Create Requirement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
