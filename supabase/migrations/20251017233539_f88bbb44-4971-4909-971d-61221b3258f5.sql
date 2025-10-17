-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'board', 'compliance', 'risk', 'audit', 'ict', 'management');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create audit_logs table (PENCOM requirement)
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create policies table (Governance Module)
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0',
  status TEXT NOT NULL DEFAULT 'draft',
  owner_id UUID REFERENCES auth.users(id),
  review_date DATE,
  approval_date DATE,
  document_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create risks table (Risk Module)
CREATE TABLE public.risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  likelihood INTEGER NOT NULL CHECK (likelihood >= 1 AND likelihood <= 5),
  impact INTEGER NOT NULL CHECK (impact >= 1 AND impact <= 5),
  risk_score INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,
  status TEXT NOT NULL DEFAULT 'open',
  owner_id UUID REFERENCES auth.users(id),
  mitigation_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create compliance_requirements table (Compliance Module)
CREATE TABLE public.compliance_requirements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requirement_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  owner_id UUID REFERENCES auth.users(id),
  due_date DATE,
  evidence_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create incidents table (Risk Module)
CREATE TABLE public.incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'reported',
  reported_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  root_cause TEXT,
  corrective_action TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Create function to check if user has any of multiple roles
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles app_role[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for audit_logs
CREATE POLICY "Admins and audit can view logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'audit']::app_role[]));

CREATE POLICY "System can insert logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for policies
CREATE POLICY "All authenticated users can view policies"
  ON public.policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Compliance and admins can manage policies"
  ON public.policies FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'compliance', 'board']::app_role[]));

-- RLS Policies for risks
CREATE POLICY "All authenticated users can view risks"
  ON public.risks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Risk managers and admins can manage risks"
  ON public.risks FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'risk', 'management']::app_role[]));

-- RLS Policies for compliance_requirements
CREATE POLICY "All authenticated users can view compliance"
  ON public.compliance_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Compliance and admins can manage requirements"
  ON public.compliance_requirements FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'compliance']::app_role[]));

-- RLS Policies for incidents
CREATE POLICY "All authenticated users can view incidents"
  ON public.incidents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Risk and audit can manage incidents"
  ON public.incidents FOR ALL
  TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['admin', 'risk', 'audit']::app_role[]));

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_risks_updated_at
  BEFORE UPDATE ON public.risks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_compliance_updated_at
  BEFORE UPDATE ON public.compliance_requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();