-- Create corporate objectives table
CREATE TABLE public.corporate_objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  department TEXT NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  fiscal_year TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.corporate_objectives ENABLE ROW LEVEL SECURITY;

-- RLS policies for objectives
CREATE POLICY "All authenticated users can view objectives"
ON public.corporate_objectives
FOR SELECT
USING (true);

CREATE POLICY "Admins and management can manage objectives"
ON public.corporate_objectives
FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'management'::app_role, 'board'::app_role]));

-- Add fields to risks table for objectives and approval workflow
ALTER TABLE public.risks
ADD COLUMN objective_id UUID REFERENCES public.corporate_objectives(id) ON DELETE SET NULL,
ADD COLUMN risk_champion_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending',
ADD COLUMN approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE;

-- Update RLS policies for risks to support approval workflow
DROP POLICY IF EXISTS "Risk managers and admins can manage risks" ON public.risks;

CREATE POLICY "Risk champions can create risks"
ON public.risks
FOR INSERT
WITH CHECK (auth.uid() = risk_champion_id OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'risk'::app_role, 'management'::app_role]));

CREATE POLICY "Department heads can approve risks"
ON public.risks
FOR UPDATE
USING (auth.uid() = owner_id OR has_any_role(auth.uid(), ARRAY['admin'::app_role, 'risk'::app_role]));

CREATE POLICY "Risk managers and admins can manage all risks"
ON public.risks
FOR ALL
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'risk'::app_role]));

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Add trigger for updated_at on objectives
CREATE TRIGGER update_corporate_objectives_updated_at
BEFORE UPDATE ON public.corporate_objectives
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_risks_objective_id ON public.risks(objective_id);
CREATE INDEX idx_risks_risk_champion_id ON public.risks(risk_champion_id);
CREATE INDEX idx_risks_approval_status ON public.risks(approval_status);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);