-- 1. COACH PROFILES
CREATE TABLE IF NOT EXISTS public.coach_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    stripe_account_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONTRACT TEMPLATES (Tiers)
CREATE TABLE IF NOT EXISTS public.contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID REFERENCES public.coach_profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_monthly_cents INT NOT NULL DEFAULT 5000,
    film_reviews_per_month INT DEFAULT 1,
    includes_sync BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. EXTEND CONTRACTS TABLE
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES public.coach_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.contract_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT true;

-- Drop constraints if we want to modify status check (we might want 'canceled', 'past_due' later, but for now we can stick to active/completed/expired)

-- 4. RLS POLICIES
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view verified coaches" ON public.coach_profiles FOR SELECT USING (is_verified = true OR id = auth.uid());
CREATE POLICY "Coaches can edit their own profile" ON public.coach_profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Coaches can insert their own profile" ON public.coach_profiles FOR INSERT WITH CHECK (id = auth.uid());

ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active contract templates" ON public.contract_templates FOR SELECT USING (is_active = true OR coach_id = auth.uid());
CREATE POLICY "Coaches can manage their own templates" ON public.contract_templates FOR ALL USING (coach_id = auth.uid());

-- Allow coaches to see contracts assigned to them
DROP POLICY IF EXISTS coach_view_contracts ON public.contracts;
CREATE POLICY "Coaches can view their athletes contracts" ON public.contracts FOR SELECT USING (coach_id = auth.uid());

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_update_coach_profiles ON public.coach_profiles;
CREATE TRIGGER trigger_update_coach_profiles BEFORE UPDATE ON public.coach_profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trigger_update_contract_templates ON public.contract_templates;
CREATE TRIGGER trigger_update_contract_templates BEFORE UPDATE ON public.contract_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
