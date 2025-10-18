-- Create controls table for control library
CREATE TABLE public.controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  control_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  control_type TEXT NOT NULL, -- preventive, detective, corrective
  status TEXT NOT NULL DEFAULT 'active',
  owner_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create policy-control mapping table
CREATE TABLE public.policy_control_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES public.controls(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(policy_id, control_id)
);

-- Create compliance checklists table for automation
CREATE TABLE public.compliance_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  framework TEXT NOT NULL, -- ISO, GDPR, CBN, etc.
  requirement_code TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  assigned_to UUID REFERENCES public.profiles(id),
  due_date DATE,
  evidence_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create remediation tasks table for automated task assignment
CREATE TABLE public.remediation_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL, -- risk, incident, compliance, control
  entity_id UUID NOT NULL,
  assigned_to UUID REFERENCES public.profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_control_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remediation_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for controls
CREATE POLICY "All authenticated users can view controls"
  ON public.controls FOR SELECT
  USING (true);

CREATE POLICY "Admins and compliance can manage controls"
  ON public.controls FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'compliance'::app_role, 'risk'::app_role]));

-- RLS Policies for policy_control_mappings
CREATE POLICY "All authenticated users can view mappings"
  ON public.policy_control_mappings FOR SELECT
  USING (true);

CREATE POLICY "Admins and compliance can manage mappings"
  ON public.policy_control_mappings FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'compliance'::app_role]));

-- RLS Policies for compliance_checklists
CREATE POLICY "All authenticated users can view checklists"
  ON public.compliance_checklists FOR SELECT
  USING (true);

CREATE POLICY "Compliance and admins can manage checklists"
  ON public.compliance_checklists FOR ALL
  USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'compliance'::app_role, 'audit'::app_role]));

-- RLS Policies for remediation_tasks
CREATE POLICY "Users can view assigned tasks"
  ON public.remediation_tasks FOR SELECT
  USING (auth.uid() = assigned_to OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'risk'::app_role, 'compliance'::app_role, 'audit'::app_role]));

CREATE POLICY "Admins and managers can create tasks"
  ON public.remediation_tasks FOR INSERT
  WITH CHECK (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'risk'::app_role, 'compliance'::app_role, 'audit'::app_role, 'management'::app_role]));

CREATE POLICY "Users can update assigned tasks"
  ON public.remediation_tasks FOR UPDATE
  USING (auth.uid() = assigned_to OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'risk'::app_role, 'compliance'::app_role, 'audit'::app_role]));

-- Add updated_at triggers
CREATE TRIGGER update_controls_updated_at
  BEFORE UPDATE ON public.controls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_checklists_updated_at
  BEFORE UPDATE ON public.compliance_checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_remediation_tasks_updated_at
  BEFORE UPDATE ON public.remediation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();