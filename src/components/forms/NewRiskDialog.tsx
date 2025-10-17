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

const riskSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200, "Title must be less than 200 characters"),
  description: z.string().trim().max(1000, "Description must be less than 1000 characters").optional(),
  category: z.string().min(1, "Category is required"),
  likelihood: z.number().min(1, "Likelihood must be between 1-5").max(5, "Likelihood must be between 1-5"),
  impact: z.number().min(1, "Impact must be between 1-5").max(5, "Impact must be between 1-5"),
  status: z.enum(["open", "mitigating", "closed", "monitoring"]),
  mitigation_plan: z.string().trim().max(2000, "Mitigation plan must be less than 2000 characters").optional(),
});

type RiskFormValues = z.infer<typeof riskSchema>;

interface NewRiskDialogProps {
  onSuccess: () => void;
}

export function NewRiskDialog({ onSuccess }: NewRiskDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<RiskFormValues>({
    resolver: zodResolver(riskSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      likelihood: 3,
      impact: 3,
      status: "open",
      mitigation_plan: "",
    },
  });

  const likelihood = form.watch("likelihood");
  const impact = form.watch("impact");
  const riskScore = likelihood * impact;

  const onSubmit = async (data: RiskFormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to create a risk",
        });
        return;
      }

      const { error } = await supabase.from("risks").insert({
        title: data.title,
        description: data.description || null,
        category: data.category,
        likelihood: data.likelihood,
        impact: data.impact,
        risk_score: data.likelihood * data.impact,
        status: data.status,
        mitigation_plan: data.mitigation_plan || null,
        owner_id: user.id,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Risk registered successfully",
      });

      form.reset();
      setOpen(false);
      onSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create risk",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Risk
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Risk</DialogTitle>
          <DialogDescription>
            Add a new risk to the enterprise risk register
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cybersecurity Breach" {...field} />
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
                      <SelectItem value="Strategic">Strategic</SelectItem>
                      <SelectItem value="Financial">Financial</SelectItem>
                      <SelectItem value="Operational">Operational</SelectItem>
                      <SelectItem value="Compliance">Compliance</SelectItem>
                      <SelectItem value="IT Security">IT Security</SelectItem>
                      <SelectItem value="Investment">Investment</SelectItem>
                      <SelectItem value="Reputational">Reputational</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="likelihood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Likelihood (1-5) *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - Rare</SelectItem>
                        <SelectItem value="2">2 - Unlikely</SelectItem>
                        <SelectItem value="3">3 - Possible</SelectItem>
                        <SelectItem value="4">4 - Likely</SelectItem>
                        <SelectItem value="5">5 - Almost Certain</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="impact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Impact (1-5) *</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">1 - Insignificant</SelectItem>
                        <SelectItem value="2">2 - Minor</SelectItem>
                        <SelectItem value="3">3 - Moderate</SelectItem>
                        <SelectItem value="4">4 - Major</SelectItem>
                        <SelectItem value="5">5 - Catastrophic</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Risk Score</FormLabel>
                <div className="h-10 flex items-center justify-center border rounded-md bg-muted">
                  <span className="text-2xl font-bold">{riskScore}</span>
                </div>
              </FormItem>
            </div>

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
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="mitigating">Mitigating</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Risk Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the risk..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mitigation_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mitigation Plan</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Actions to reduce likelihood or impact..."
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
                {form.formState.isSubmitting ? "Creating..." : "Register Risk"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
