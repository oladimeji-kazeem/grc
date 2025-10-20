-- Create regulation mappings table for auto-mapping policies to regulations
CREATE TABLE public.regulation_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.compliance_requirements(id) ON DELETE CASCADE,
  mapping_confidence DECIMAL(3,2) DEFAULT 0.00,
  mapped_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  mapped_by UUID REFERENCES auth.users(id),
  mapping_rationale TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(policy_id, requirement_id)
);

-- Create predictive alerts table
CREATE TABLE public.predictive_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  predicted_date DATE,
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create AI recommendations table
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  rationale TEXT NOT NULL,
  confidence_score DECIMAL(3,2) DEFAULT 0.00,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented')),
  implemented_by UUID REFERENCES auth.users(id),
  implemented_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create risk factors table for dynamic scoring
CREATE TABLE public.risk_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID REFERENCES public.risks(id) ON DELETE CASCADE NOT NULL,
  factor_name TEXT NOT NULL,
  factor_value DECIMAL(5,2) NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.regulation_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictive_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_factors ENABLE ROW LEVEL SECURITY;

-- RLS Policies for regulation_mappings
CREATE POLICY "All authenticated users can view mappings"
ON public.regulation_mappings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins and compliance can manage mappings"
ON public.regulation_mappings FOR ALL
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'compliance'::app_role]));

-- RLS Policies for predictive_alerts
CREATE POLICY "All authenticated users can view alerts"
ON public.predictive_alerts FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can create alerts"
ON public.predictive_alerts FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can acknowledge their alerts"
ON public.predictive_alerts FOR UPDATE
TO authenticated
USING (true);

-- RLS Policies for ai_recommendations
CREATE POLICY "All authenticated users can view recommendations"
ON public.ai_recommendations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "System can create recommendations"
ON public.ai_recommendations FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage recommendations"
ON public.ai_recommendations FOR ALL
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'risk'::app_role, 'compliance'::app_role]));

-- RLS Policies for risk_factors
CREATE POLICY "All authenticated users can view risk factors"
ON public.risk_factors FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Risk managers can manage factors"
ON public.risk_factors FOR ALL
TO authenticated
USING (has_any_role(auth.uid(), ARRAY['admin'::app_role, 'risk'::app_role]));

-- Create updated_at triggers
CREATE TRIGGER update_regulation_mappings_updated_at
  BEFORE UPDATE ON public.regulation_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_predictive_alerts_updated_at
  BEFORE UPDATE ON public.predictive_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at
  BEFORE UPDATE ON public.ai_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risk_factors_updated_at
  BEFORE UPDATE ON public.risk_factors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();