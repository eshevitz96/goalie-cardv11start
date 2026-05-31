'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import FlowScreen from '@/components/calendar/FlowScreen';
import TextInput from '@/components/calendar/TextInput';
import ChipSelect from '@/components/onboarding/ChipSelect';

type OnboardingStep =
  | 'name'
  | 'handle'
  | 'sport'
  | 'teams'
  | 'about'
  | 'intention'
  | 'commitment';

const SUGGESTED_TAGS = [
  "Class of 2026", "Class of 2027", "Class of 2028", "Class of 2029",
  "Right stick", "Left stick", "Atlanta", "Chicago",
  "Northeast", "Southeast", "Mid-Atlantic"
];

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function OnboardingPage() {
  const router = useRouter();
  const { userId, userEmail, isAuthenticated, loading: authLoading } = useAuth();

  const [step, setStep] = useState<OnboardingStep>('name');
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [sport, setSport] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [teamInput, setTeamInput] = useState('');
  const [profileTags, setProfileTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [consentAgreed, setConsentAgreed] = useState(false);
  const [intention, setIntention] = useState('');

  // Validation States for Handle/Username
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const usernameDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Save/Commitment State
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [gcNumber, setGcNumber] = useState<number | null>(null);
  const [hasPrivateTrainingAccess, setHasPrivateTrainingAccess] = useState(false);

  // Mount logic: redirect unauthenticated & completed users
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    async function checkExistingOnboarding() {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from('users')
          .select('onboarding_completed')
          .eq('auth_user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data?.onboarding_completed) {
          router.replace('/dashboard');
        } else {
          setCheckingProfile(false);
        }
      } catch (err) {
        console.error('Error checking existing onboarding profile:', err);
        setCheckingProfile(false);
      }
    }

    checkExistingOnboarding();
  }, [userId, isAuthenticated, authLoading, router]);

  // Debounced Username Validation
  useEffect(() => {
    if (usernameDebounceRef.current) {
      clearTimeout(usernameDebounceRef.current);
    }

    const trimmed = username.toLowerCase().trim();
    if (!trimmed) {
      setUsernameError(null);
      setUsernameAvailable(false);
      setIsValidatingUsername(false);
      return;
    }

    // Tier 1: Format Validation
    const formatRegex = /^[a-z0-9_]{3,20}$/;
    if (!formatRegex.test(trimmed)) {
      setUsernameError("3–20 characters, letters, numbers, and underscores only");
      setUsernameAvailable(false);
      return;
    }

    setIsValidatingUsername(true);
    setUsernameError(null);
    setUsernameAvailable(false);

    usernameDebounceRef.current = setTimeout(async () => {
      try {
        // Tier 2: Reserved Username Check
        const { data: reservedData, error: reservedErr } = await supabase
          .from('reserved_usernames')
          .select('username')
          .eq('username', trimmed)
          .maybeSingle();

        if (reservedErr) throw reservedErr;

        if (reservedData) {
          setUsernameError("Username taken");
          setUsernameAvailable(false);
          setIsValidatingUsername(false);
          return;
        }

        // Tier 3: Uniqueness Check
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('username')
          .eq('username', trimmed)
          .maybeSingle();

        if (userErr) throw userErr;

        if (userData) {
          setUsernameError("Username taken");
          setUsernameAvailable(false);
          setIsValidatingUsername(false);
          return;
        }

        setUsernameAvailable(true);
        setUsernameError(null);
      } catch (err) {
        console.error('Error validating username:', err);
        setUsernameError("Validation failed. Please try again.");
      } finally {
        setIsValidatingUsername(false);
      }
    }, 400);

    return () => {
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    };
  }, [username]);

  // Step 3 (Sport) Selection auto-advances
  const handleSportSelect = (sportId: string) => {
    setSport(sportId);
    setTimeout(() => {
      setStep('teams');
    }, 300);
  };

  // Step 4 Tag Handlers
  const addTeamTag = () => {
    const trimmed = teamInput.trim();
    if (trimmed && !teams.includes(trimmed)) {
      setTeams([...teams, trimmed]);
    }
    setTeamInput('');
  };

  const removeTeamTag = (val: string) => {
    setTeams(teams.filter((t) => t !== val));
  };

  // Step 5 Tag Handlers
  const addCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (trimmed && !profileTags.includes(trimmed)) {
      setProfileTags([...profileTags, trimmed]);
    }
    setCustomTagInput('');
  };

  const toggleSuggestedTag = (tag: string) => {
    if (profileTags.includes(tag)) {
      setProfileTags(profileTags.filter((t) => t !== tag));
    } else {
      setProfileTags([...profileTags, tag]);
    }
  };

  // Transaction Save Sequence (Step 6 completion)
  const handleCompleteSave = async () => {
    if (!userId || !userEmail) return;
    setSaving(true);
    setSaveError(null);

    try {
      // 1. Upsert public.users
      const { data: userProfile, error: userErr } = await supabase
        .from('users')
        .upsert({
          auth_user_id: userId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          username: username.toLowerCase().trim(),
          email: userEmail,
          primary_sport: sport,
          teams: teams,
          profile_tags: profileTags,
          is_over_18: true,
          consent_agreed: true,
          consent_agreed_at: new Date().toISOString(),
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString(),
        }, { onConflict: 'auth_user_id' })
        .select('*')
        .single();

      if (userErr) throw userErr;
      if (!userProfile) throw new Error("Failed to retrieve upserted user profile.");

      setGcNumber(userProfile.gc_number);

      // 2. Insert public.seasons
      const today = new Date();
      const nextYear = new Date(today);
      nextYear.setFullYear(today.getFullYear() + 1);
      const todayDate = formatLocalDate(today);
      const endDate = formatLocalDate(nextYear);

      const { error: seasonErr } = await supabase
        .from('seasons')
        .insert({
          user_id: userProfile.id,
          name: "Season 1",
          sport: sport,
          start_date: todayDate,
          end_date: endDate,
          is_active: true,
        });

      if (seasonErr) throw seasonErr;

      // 3. Upsert daily_users (backward compatibility)
      const { error: dailyUserErr } = await supabase
        .from('daily_users')
        .upsert({
          id: userId,
          name: `${firstName.trim()} ${lastName.trim()}`,
          sport: sport,
        });

      if (dailyUserErr) throw dailyUserErr;

      // 4. Insert daily_seasons (backward compatibility)
      const firstTeam = teams.length > 0 ? teams[0] : null;
      const { data: dailySeason, error: dailySeasonErr } = await supabase
        .from('daily_seasons')
        .insert({
          user_id: userId,
          name: "Season 1",
          team: firstTeam,
          start_date: todayDate,
          phase: 'regular',
        })
        .select()
        .single();

      if (dailySeasonErr) throw dailySeasonErr;

      // 5. Insert daily_sessions
      const { data: dailySession, error: dailySessionErr } = await supabase
        .from('daily_sessions')
        .insert({
          user_id: userId,
          session_date: todayDate,
          day_types: ['training'],
          season_id: dailySeason.id,
        })
        .select()
        .single();

      if (dailySessionErr) throw dailySessionErr;

      // 6. Insert daily_morning_entries (only if Step 6 is non-empty)
      if (intention.trim()) {
        const { error: morningErr } = await supabase
          .from('daily_morning_entries')
          .insert({
            session_id: dailySession.id,
            intention: intention.trim(),
            mood: 'solid',
            whats_bouncing: null,
          });

        if (morningErr) throw morningErr;
      }

      // 7. Check private training status
      const { data: ptSubmission, error: ptErr } = await supabase
        .from('private_training_submissions')
        .select('payment_status')
        .eq('email', userEmail.toLowerCase())
        .eq('payment_status', 'paid')
        .maybeSingle();

      if (ptErr) {
        console.error('Error checking private training submission status:', ptErr);
      }

      setHasPrivateTrainingAccess(!!ptSubmission);

      // 8. Completed transaction successfully, transition to Commitment
      setStep('commitment');
    } catch (err: any) {
      console.error('Transactional save failed:', err);
      setSaveError(err.message || 'Onboarding save failed. Please verify your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    if (step === 'handle') setStep('name');
    else if (step === 'sport') setStep('handle');
    else if (step === 'teams') setStep('sport');
    else if (step === 'about') setStep('teams');
    else if (step === 'intention') setStep('about');
  };

  if (authLoading || checkingProfile) {
    return (
      <div className="calendar-root bg-canvas min-h-screen flex items-center justify-center text-text-secondary text-body-lg">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <span>Setting up goalie environment...</span>
        </div>
      </div>
    );
  }

  // ── Step 1: Name ──
  if (step === 'name') {
    return (
      <div className="calendar-root bg-canvas min-h-screen">
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          <FlowScreen showBack={false}>
            <div className="animate-fade-in-up">
              <h1 className="text-hero-sm md:text-hero font-extrabold tracking-tight leading-tight mb-12">
                What&apos;s your name?
              </h1>
              <div className="space-y-6">
                <TextInput
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="First name"
                  autoFocus
                />
                <TextInput
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Last name"
                  autoFocus={false}
                />
              </div>
              <div className="mt-12 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('handle')}
                  disabled={!firstName.trim() || !lastName.trim()}
                  className="px-8 py-3.5 bg-text-primary text-canvas font-semibold rounded-2xl text-body-lg
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </FlowScreen>
        </div>
      </div>
    );
  }

  // ── Step 2: Handle ──
  if (step === 'handle') {
    return (
      <div className="calendar-root bg-canvas min-h-screen">
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          <FlowScreen onBack={goBack}>
            <div className="animate-fade-in-up">
              <h1 className="text-hero-sm md:text-hero font-extrabold tracking-tight leading-tight mb-3">
                Choose your handle.
              </h1>
              <p className="text-body text-text-secondary mb-12">
                This is permanent. Choose carefully.
              </p>

              <div className="flex items-center w-full relative">
                <span className="text-title font-bold text-text-muted mr-1 pb-3 min-h-[56px] flex items-center">@</span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="username"
                    className="w-full bg-transparent text-text-primary text-title font-bold
                      border-b-2 border-border-subtle focus:border-accent focus:outline-none
                      transition-colors duration-200 pb-3 min-h-[56px]
                      placeholder:text-text-muted"
                    autoFocus
                  />
                </div>
              </div>

              <div className="min-h-[24px] mt-3">
                {isValidatingUsername && (
                  <p className="text-caption text-text-secondary animate-fade-in">Checking availability...</p>
                )}
                {usernameError && (
                  <p className="text-caption text-red-500 animate-fade-in">{usernameError}</p>
                )}
                {usernameAvailable && !isValidatingUsername && (
                  <p className="text-caption text-accent animate-fade-in">Username available ✓</p>
                )}
              </div>

              <div className="mt-12 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('sport')}
                  disabled={!usernameAvailable || isValidatingUsername}
                  className="px-8 py-3.5 bg-text-primary text-canvas font-semibold rounded-2xl text-body-lg
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </FlowScreen>
        </div>
      </div>
    );
  }

  // ── Step 3: Sport ──
  if (step === 'sport') {
    return (
      <div className="calendar-root bg-canvas min-h-screen">
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          <FlowScreen onBack={goBack}>
            <div className="animate-fade-in-up">
              <h1 className="text-hero-sm md:text-hero font-extrabold tracking-tight leading-tight mb-4">
                What do you play?
              </h1>
              <p className="text-body text-text-secondary mb-12">Select your primary sport.</p>

              <ChipSelect selected={sport} onChange={handleSportSelect} />
            </div>
          </FlowScreen>
        </div>
      </div>
    );
  }

  // ── Step 4: Teams ──
  if (step === 'teams') {
    return (
      <div className="calendar-root bg-canvas min-h-screen">
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          <FlowScreen onBack={goBack}>
            <div className="animate-fade-in-up">
              <h1 className="text-hero-sm md:text-hero font-extrabold tracking-tight leading-tight mb-12">
                Who do you play for?
              </h1>

              {/* Tags Display */}
              <div className="flex flex-wrap gap-2 mb-6 min-h-[44px]">
                {teams.map((team, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-2 px-4 py-2 bg-card hover:bg-card-hover border border-border-subtle rounded-full text-body font-semibold text-text-primary animate-fade-in"
                  >
                    {team}
                    <button
                      type="button"
                      onClick={() => removeTeamTag(team)}
                      className="text-text-muted hover:text-text-primary font-bold cursor-pointer transition-colors"
                      aria-label={`Remove ${team}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>

              {/* Tag Input */}
              <div className="flex items-center gap-4 w-full relative">
                <div className="flex-1">
                  <input
                    type="text"
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    placeholder="Enter team name..."
                    className="w-full bg-transparent text-text-primary text-title font-bold
                      border-b-2 border-border-subtle focus:border-accent focus:outline-none
                      transition-colors duration-200 pb-3 min-h-[56px]
                      placeholder:text-text-muted"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTeamTag();
                      }
                    }}
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={addTeamTag}
                  className="px-6 py-3.5 bg-card border border-border-subtle hover:border-border-focus text-text-primary rounded-2xl font-semibold cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>

              <div className="mt-16 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setTeams([]);
                    setStep('about');
                  }}
                  className="text-text-secondary hover:text-text-primary text-body-lg transition-colors cursor-pointer"
                >
                  Skip for now
                </button>

                <button
                  type="button"
                  onClick={() => setStep('about')}
                  className="px-8 py-3.5 bg-text-primary text-canvas font-semibold rounded-2xl text-body-lg cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </FlowScreen>
        </div>
      </div>
    );
  }

  // ── Step 5: About you ──
  if (step === 'about') {
    return (
      <div className="calendar-root bg-canvas min-h-screen">
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          <FlowScreen onBack={goBack}>
            <div className="animate-fade-in-up">
              <h1 className="text-hero-sm md:text-hero font-extrabold tracking-tight leading-tight mb-3">
                Anything else?
              </h1>
              <p className="text-body text-text-secondary mb-8">
                Add what feels right. Skip what doesn&apos;t.
              </p>

              {/* Suggestions Grid */}
              <div className="flex flex-wrap gap-2.5 mb-8">
                {SUGGESTED_TAGS.map((tag) => {
                  const isSelected = profileTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleSuggestedTag(tag)}
                      className={`
                        px-4 py-2.5 rounded-full text-caption font-semibold border transition-all duration-200 cursor-pointer
                        ${isSelected
                          ? 'bg-accent/10 border-accent text-accent'
                          : 'bg-card border-border-subtle text-text-secondary hover:bg-card-hover hover:border-border-focus'
                        }
                      `}
                    >
                      {isSelected ? `${tag} ✓` : tag}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="flex items-center gap-4 w-full relative mb-12">
                <div className="flex-1">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    placeholder="Custom tag..."
                    className="w-full bg-transparent text-text-primary text-title font-bold
                      border-b-2 border-border-subtle focus:border-accent focus:outline-none
                      transition-colors duration-200 pb-3 min-h-[56px]
                      placeholder:text-text-muted"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomTag();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="px-6 py-3.5 bg-card border border-border-subtle hover:border-border-focus text-text-primary rounded-2xl font-semibold cursor-pointer transition-colors"
                >
                  Add
                </button>
              </div>

              {/* Consent Box */}
              <label className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border-subtle select-none cursor-pointer transition-colors hover:border-border-focus">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-1 w-5 h-5 accent-accent cursor-pointer"
                />
                <span className="text-body-lg text-text-secondary leading-normal">
                  I am 13 or older and agree to the{' '}
                  <a href="#" className="underline hover:text-text-primary transition-colors">Terms of Service</a>{' '}
                  and{' '}
                  <a href="#" className="underline hover:text-text-primary transition-colors">Privacy Policy</a>
                </span>
              </label>

              <div className="mt-12 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep('intention')}
                  disabled={!consentAgreed}
                  className="px-8 py-3.5 bg-text-primary text-canvas font-semibold rounded-2xl text-body-lg
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          </FlowScreen>
        </div>
      </div>
    );
  }

  // ── Step 6: First Intention ──
  if (step === 'intention') {
    return (
      <div className="calendar-root bg-canvas min-h-screen">
        <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
          <FlowScreen onBack={goBack}>
            <div className="animate-fade-in-up">
              <h1 className="text-hero-sm md:text-hero font-extrabold tracking-tight leading-tight mb-3">
                What&apos;s your primary focus today?
              </h1>
              <p className="text-body text-text-secondary mb-12">
                Your first entry. Make it specific.
              </p>

              {saveError && (
                <div className="mb-8 p-4 bg-red-950/40 border border-red-500/50 rounded-2xl text-red-400 text-body animate-fade-in">
                  <p className="font-bold mb-1">Could not save onboarding profile</p>
                  <p className="text-caption">{saveError}</p>
                </div>
              )}

              <TextInput
                value={intention}
                onChange={setIntention}
                placeholder="One specific thing..."
                maxLength={80}
                autoFocus
              />

              <div className="mt-12 flex justify-end">
                <button
                  type="button"
                  onClick={handleCompleteSave}
                  disabled={saving}
                  className="px-8 py-3.5 bg-text-primary text-canvas font-semibold rounded-2xl text-body-lg
                    disabled:opacity-30 disabled:cursor-not-allowed
                    transition-all duration-200 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Done'}
                </button>
              </div>
            </div>
          </FlowScreen>
        </div>
      </div>
    );
  }

  // ── Commitment Screen (Post-Save View) ──
  return (
    <div className="calendar-root bg-canvas min-h-screen">
      <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
        <FlowScreen showBack={false}>
          <div className="animate-fade-in-up text-center max-w-sm mx-auto">
            <h1 className="text-hero font-black tracking-tight leading-none mb-12">
              You&apos;re in.
            </h1>

            {/* GC Monospace Monolith */}
            <div className="my-8">
              <p
                style={{ color: '#006747' }}
                className="text-5xl font-black font-mono tracking-wider"
              >
                GC-{String(gcNumber ?? 0).padStart(4, '0')}
              </p>
              <p className="text-caption text-text-muted mt-3">
                Your number. Permanent.
              </p>
            </div>

            {hasPrivateTrainingAccess && (
              <div className="mb-12 animate-fade-in">
                <p style={{ color: '#006747' }} className="text-body font-bold">
                  Private training access confirmed.
                </p>
              </div>
            )}

            <div className="h-6" />

            <button
              type="button"
              onClick={() => router.replace('/dashboard')}
              className="w-full py-4 bg-white text-zinc-950 font-bold rounded-full text-body-lg
                hover:bg-zinc-200 active:scale-[0.98] transition-all duration-200 cursor-pointer text-center"
            >
              Enter Goalie Card
            </button>

            <p className="text-caption text-text-muted mt-8 leading-normal">
              By continuing you agree to our<br />
              <a href="#" className="underline hover:text-text-secondary transition-colors">Terms of Service</a> and{' '}
              <a href="#" className="underline hover:text-text-secondary transition-colors">Privacy Policy</a>
            </p>
          </div>
        </FlowScreen>
      </div>
    </div>
  );
}
