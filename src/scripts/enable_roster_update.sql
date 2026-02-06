-- Allow public update for claiming/activation (Temporary for Demo/Testing)
-- Or better: Allow update if the user has a valid OTP session?
-- Actually, the activation flow runs client-side. If the user is authenticated (via OTP),
-- they should be able to update their OWN roster entry if we link it.
-- But at Step 3 (Details), they are NOT YET Actively Claimed, but they ARE verified via OTP?
-- Wait, handleVerifyOtp creates a session. So they are logged in.

-- POLICY: Allow users to update roster_uploads where email matches their auth email.

CREATE POLICY "Allow update for matching email" ON public.roster_uploads
FOR UPDATE
USING (
  lower(email) = lower(auth.jwt() ->> 'email')
)
WITH CHECK (
  lower(email) = lower(auth.jwt() ->> 'email')
);

-- Ensure RLS is enabled
ALTER TABLE public.roster_uploads ENABLE ROW LEVEL SECURITY;
