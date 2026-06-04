'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import FlowScreen from '@/components/calendar/FlowScreen';
import TextInput from '@/components/calendar/TextInput';
import ChipSelect from '@/components/onboarding/ChipSelect';
import { Loader2, Calendar, User, ChevronRight, CheckCircle, Tag, Shield, Compass, HeartPulse, Sparkles } from 'lucide-react';

const SUGGESTED_TAGS = [
  "Class of 2026", "Class of 2027", "Class of 2028", "Class of 2029",
  "Right stick", "Left stick", "Atlanta", "Chicago",
  "Northeast", "Southeast", "Mid-Atlantic"
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get('edit') === 'true';

  const { userId, userEmail, isAuthenticated, loading: authLoading } = useAuth();

  const [loadingData, setLoadingData] = useState(true);
  const [step, setStep] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [birthday, setBirthday] = useState(''); // YYYY-MM-DD
  const [sport, setSport] = useState<string | null>(null);
  const [teams, setTeams] = useState<string[]>([]);
  const [teamInput, setTeamInput] = useState('');
  const [profileTags, setProfileTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [height, setHeight] = useState('');
  const [gpa, setGpa] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [handedness, setHandedness] = useState('');

  // Baseline Questionnaire State
  const [baselineAnswers, setBaselineAnswers] = useState({
    trajectory: 'neutral', // good, neutral, bad
    readiness: 'neutral',  // good, neutral, bad
    focus: 'neutral',      // good, neutral, bad (represents season phase)
  });

  // Username validation
  const [isValidatingUsername, setIsValidatingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const usernameDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Mount logic: fetch existing user settings if they exist
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    async function loadUserProfile() {
      if (!userId || userId === '00000000-0000-0000-0000-000000000000') {
        setLoadingData(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('first_name, last_name, username, date_of_birth, primary_sport, teams, profile_tags, onboarding_completed, grad_year, handedness, height, gpa')
          .eq('auth_user_id', userId)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setFirstName(data.first_name || '');
          setLastName(data.last_name || '');
          setUsername(data.username || '');
          setBirthday(data.date_of_birth || '');
          setSport(data.primary_sport || null);
          setTeams(data.teams || []);
          setProfileTags(data.profile_tags || []);
          setGradYear(data.grad_year ? String(data.grad_year) : '');
          setHandedness(data.handedness || '');
          setHeight(data.height || '');
          setGpa(data.gpa || '');
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoadingData(false);
      }
    }

    loadUserProfile();
  }, [userId, isAuthenticated, authLoading, router]);

  // Debounced Username check
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
        // Reserved Username Check
        const { data: reserved } = await supabase
          .from('reserved_usernames')
          .select('username')
          .eq('username', trimmed)
          .maybeSingle();

        if (reserved) {
          setUsernameError("Username taken");
          setIsValidatingUsername(false);
          return;
        }

        // Uniqueness Check in users table
        const { data: existingUser } = await supabase
          .from('users')
          .select('username')
          .eq('username', trimmed)
          .not('auth_user_id', 'eq', userId) // exclude self
          .maybeSingle();

        if (existingUser) {
          setUsernameError("Username taken");
        } else {
          setUsernameAvailable(true);
        }
      } catch (err) {
        console.error('Error validating username:', err);
      } finally {
        setIsValidatingUsername(false);
      }
    }, 400);

    return () => {
      if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
    };
  }, [username, userId]);

  // Save changes to database
  const saveProfileData = async (isWizardFinished: boolean) => {
    if (!userId) return;
    setSaving(true);
    setSaveError(null);

    // Dev bypass mode
    if (userId === '00000000-0000-0000-0000-000000000000') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dev_onboarding_completed', 'true');
        localStorage.setItem('dev_username', username);
      }
      setSaving(false);
      router.replace(isEditMode ? '/profile' : '/dashboard');
      return;
    }

    try {
      // 1. Update public.users matching auth_user_id
      const { error: userErr } = await supabase
        .from('users')
        .update({
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          username: username.toLowerCase().trim() || null,
          date_of_birth: birthday || null,
          primary_sport: sport || null,
          teams: teams.length > 0 ? teams : null,
          profile_tags: profileTags.length > 0 ? profileTags : null,
          grad_year: gradYear.trim() && !isNaN(Number(gradYear.trim())) ? parseInt(gradYear.trim(), 10) : null,
          handedness: handedness || null,
          height: height.trim() || null,
          gpa: gpa.trim() || null,
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('auth_user_id', userId);

      if (userErr) throw userErr;

      // 2. If completing baseline questionnaire, calculate & save performance index baseline snapshot
      if (isWizardFinished && step === 4) {
        let score = 75; // Default starting point
        const { trajectory, readiness, focus } = baselineAnswers;

        let scoreWeight = 0;
        if (trajectory === 'good') scoreWeight += 40;
        else if (trajectory === 'neutral') scoreWeight += 25;
        else scoreWeight += 10;

        if (readiness === 'good') scoreWeight += 30;
        else if (readiness === 'neutral') scoreWeight += 20;
        else scoreWeight += 5;

        if (focus === 'bad') scoreWeight += 30; // In-season phase
        else if (focus === 'neutral') scoreWeight += 20; // Tryouts
        else scoreWeight += 15; // Off-season

        score = scoreWeight;

        // Insert baseline snapshot row
        await supabase.from('performance_index_snapshots').insert({
          user_id: userId,
          score: score,
          label: 'Baseline Assessment',
          created_at: new Date().toISOString()
        });
      }

      router.replace(isEditMode ? '/profile' : '/dashboard');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setSaveError(err.message || 'Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleNextStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      saveProfileData(true);
    }
  };

  const handleSkipStep = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      saveProfileData(true);
    }
  };

  const handleSkipAll = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      // Mark onboarding completed and redirect
      if (userId !== '00000000-0000-0000-0000-000000000000') {
        await supabase
          .from('users')
          .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString()
          })
          .eq('auth_user_id', userId);
      } else {
        localStorage.setItem('dev_onboarding_completed', 'true');
      }
      router.replace('/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Tag functions
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

  if (authLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090B] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-[#006747]" size={40} />
          <span className="text-zinc-400 font-mono tracking-wider uppercase text-xs">Loading Card Profile...</span>
        </div>
      </div>
    );
  }

  // ── EDIT MODE (Single page edit form) ──
  if (isEditMode) {
    return (
      <main className="min-h-screen bg-[#09090B] text-foreground font-sans pt-12 pb-24 px-4 md:px-8 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#006747]/50 via-[#006747]/20 to-[#006747]/50" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#006747]/3 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-md mx-auto space-y-8 relative z-10">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-white uppercase">Edit Profile</h1>
            <p className="text-sm text-zinc-400">Update your goalie card profile details below.</p>
          </div>

          {saveError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-bold leading-normal">
              {saveError}
            </div>
          )}

          <div className="space-y-6">
            {/* Identity Card */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4 backdrop-blur-md">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
                <User size={12} className="text-[#006747]" /> Goalie Identity
              </h2>

              {/* Birthday at top */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Birthday</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl pl-12 pr-5 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                  />
                </div>
                <span className="text-[9px] text-zinc-500 italic">Used for age verification & scoring metrics.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First Name"
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last Name"
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Username (Handle)</label>
                <div className="relative flex items-center">
                  <span className="text-zinc-500 absolute left-4 font-bold text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="username"
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl pl-8 pr-5 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-bold placeholder:text-zinc-600"
                  />
                </div>
                {isValidatingUsername && (
                  <p className="text-[10px] text-zinc-500">Checking availability...</p>
                )}
                {usernameError && (
                  <p className="text-[10px] text-red-500">{usernameError}</p>
                )}
                {usernameAvailable && !isValidatingUsername && (
                  <p className="text-[10px] text-[#006747]">Username available ✓</p>
                )}
              </div>
            </div>

            {/* Sport & Teams */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4 backdrop-blur-md">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
                <Compass size={12} className="text-[#006747]" /> Sport & Teams
              </h2>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Primary Sport</label>
                <ChipSelect selected={sport} onChange={setSport} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Teams</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {teams.map((t, i) => (
                    <span key={i} className="px-3 py-1 bg-[#006747]/10 text-[#006747] border border-[#006747]/20 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                      {t}
                      <button type="button" onClick={() => removeTeamTag(t)} className="text-zinc-400 hover:text-white font-bold">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    placeholder="Enter team name..."
                    className="flex-1 bg-black/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#006747] transition-all text-xs font-semibold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTeamTag();
                      }
                    }}
                  />
                  <button type="button" onClick={addTeamTag} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Add</button>
                </div>
              </div>
            </div>

            {/* Profile Tags */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4 backdrop-blur-md">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
                <Tag size={12} className="text-[#006747]" /> Profile Tags
              </h2>

              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((t) => {
                  const isSelected = profileTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleSuggestedTag(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                        isSelected 
                          ? 'bg-[#006747]/10 border-[#006747] text-[#006747]' 
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {isSelected ? `${t} ✓` : t}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="Custom tag..."
                  className="flex-1 bg-black/60 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#006747] transition-all text-xs font-semibold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                />
                <button type="button" onClick={addCustomTag} className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Add</button>
              </div>
            </div>

            {/* Academic & Physical Details */}
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4 backdrop-blur-md animate-fade-in">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
                <Sparkles size={12} className="text-[#006747]" /> Goalie Attributes
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Height</label>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="e.g. 6ft 0in"
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Class (Grad Year)</label>
                  <input
                    type="text"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    placeholder="e.g. 2026"
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">GPA</label>
                  <input
                    type="text"
                    value={gpa}
                    onChange={(e) => setGpa(e.target.value)}
                    placeholder="e.g. 3.85"
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Stick (Handedness)</label>
                  <select
                    value={handedness}
                    onChange={(e) => setHandedness(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                  >
                    <option value="" className="bg-zinc-950">Select hand...</option>
                    <option value="right" className="bg-zinc-950">Right Handed</option>
                    <option value="left" className="bg-zinc-950">Left Handed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.push('/profile')}
              className="flex-1 py-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-bold rounded-2xl text-sm transition-colors cursor-pointer text-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveProfileData(false)}
              disabled={saving || !!(username && !usernameAvailable && usernameError !== null)}
              className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 disabled:opacity-50 font-bold rounded-2xl text-sm transition-colors cursor-pointer text-center flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="animate-spin text-black" size={16} /> : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── WIZARD MODE (4 steps, fully skippable) ──
  return (
    <div className="calendar-root bg-[#09090B] min-h-screen text-white relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#006747]/50 via-[#006747]/20 to-[#006747]/50" />

      {/* Skip Onboarding completely header button */}
      <div className="absolute top-6 right-6 z-20">
        <button
          type="button"
          onClick={handleSkipAll}
          className="text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors cursor-pointer"
        >
          Skip Setup
        </button>
      </div>

      <FlowScreen showBack={step > 1} onBack={() => setStep(step - 1)}>
        <div className="animate-fade-in-up space-y-8">
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step >= s ? 'w-8 bg-[#006747]' : 'w-2 bg-zinc-800'
                }`}
              />
            ))}
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2">Step {step} of 4</span>
          </div>

          {/* STEP 1: IDENTITY (Birthday + Name + Username) */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">Who are you?</h1>
                <p className="text-sm text-zinc-400">Let&apos;s set up your basic goalie identity card.</p>
              </div>

              {/* Birthday at top */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Birthday</label>
                <div className="relative">
                  <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl pl-12 pr-5 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                  />
                </div>
                <span className="text-[9px] text-zinc-500 italic">Used for age verification & scoring metrics.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <TextInput
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="First name"
                />
                <TextInput
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Last name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Choose your handle</label>
                <div className="relative flex items-center">
                  <span className="text-zinc-500 absolute left-4 font-bold text-sm">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="username"
                    className="w-full bg-black/60 border border-zinc-800 rounded-xl pl-8 pr-5 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-bold placeholder:text-zinc-600"
                  />
                </div>
                {isValidatingUsername && (
                  <p className="text-[10px] text-zinc-500">Checking availability...</p>
                )}
                {usernameError && (
                  <p className="text-[10px] text-red-500">{usernameError}</p>
                )}
                {usernameAvailable && !isValidatingUsername && (
                  <p className="text-[10px] text-[#006747]">Username available ✓</p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: SPORT & TEAMS */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">Sport & Roster</h1>
                <p className="text-sm text-zinc-400">Select what you play and which teams you represent.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">What do you play?</label>
                <ChipSelect selected={sport} onChange={setSport} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Who do you play for?</label>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[30px]">
                  {teams.map((t, i) => (
                    <span key={i} className="px-3 py-1 bg-[#006747]/10 text-[#006747] border border-[#006747]/20 rounded-full text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
                      {t}
                      <button type="button" onClick={() => removeTeamTag(t)} className="text-zinc-400 hover:text-white font-bold">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={teamInput}
                    onChange={(e) => setTeamInput(e.target.value)}
                    placeholder="Enter team name..."
                    className="flex-1 bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-xs font-semibold"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTeamTag();
                      }
                    }}
                  />
                  <button type="button" onClick={addTeamTag} className="px-4 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Add</button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TAGS */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">Custom Attributes</h1>
                <p className="text-sm text-zinc-400">Add characteristics to help coaches filter and find your card.</p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_TAGS.map((t) => {
                  const isSelected = profileTags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleSuggestedTag(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                        isSelected 
                          ? 'bg-[#006747]/10 border-[#006747] text-[#006747]' 
                          : 'bg-black/40 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {isSelected ? `${t} ✓` : t}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="Custom tag..."
                  className="flex-1 bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-xs font-semibold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                />
                <button type="button" onClick={addCustomTag} className="px-4 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-colors">Add</button>
              </div>

              {/* Profile Attributes Inputs */}
              <div className="border-t border-zinc-800/80 pt-6 mt-6 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Goalie Attributes</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Height</label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 6ft 0in"
                      className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Class (Grad Year)</label>
                    <input
                      type="text"
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      placeholder="e.g. 2026"
                      className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">GPA</label>
                    <input
                      type="text"
                      value={gpa}
                      onChange={(e) => setGpa(e.target.value)}
                      placeholder="e.g. 3.85"
                      className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Stick (Handedness)</label>
                    <select
                      value={handedness}
                      onChange={(e) => setHandedness(e.target.value)}
                      className="w-full bg-black/60 border border-zinc-800 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#006747] transition-all text-sm font-semibold"
                    >
                      <option value="" className="bg-zinc-950">Select hand...</option>
                      <option value="right" className="bg-zinc-950">Right Handed</option>
                      <option value="left" className="bg-zinc-950">Left Handed</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: BASELINE QUESTIONNAIRE */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white mb-2 uppercase">Performance Baseline</h1>
                <p className="text-sm text-zinc-400">Answer 3 simple questions to set your initial performance rating.</p>
              </div>

              {/* Trajectory */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#006747]" /> 1. How has your performance state been lately?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['good', 'neutral', 'bad'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBaselineAnswers({ ...baselineAnswers, trajectory: m })}
                      className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                        baselineAnswers.trajectory === m
                          ? 'bg-[#006747]/15 border-[#006747] text-[#006747] shadow-[0_0_15px_rgba(0,103,71,0.1)]'
                          : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <HeartPulse size={14} className="text-[#006747]" /> 2. Rate your current physical readiness
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['good', 'neutral', 'bad'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setBaselineAnswers({ ...baselineAnswers, readiness: m })}
                      className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                        baselineAnswers.readiness === m
                          ? 'bg-[#006747]/15 border-[#006747] text-[#006747] shadow-[0_0_15px_rgba(0,103,71,0.1)]'
                          : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {m === 'good' ? 'fresh' : m === 'neutral' ? 'steady' : 'tired'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Focus (Phase) */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Shield size={14} className="text-[#006747]" /> 3. Current Season Stage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'good', label: 'Off-season' },
                    { key: 'neutral', label: 'Tryouts' },
                    { key: 'bad', label: 'In-season' },
                  ].map((phase) => (
                    <button
                      key={phase.key}
                      type="button"
                      onClick={() => setBaselineAnswers({ ...baselineAnswers, focus: phase.key })}
                      className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${
                        baselineAnswers.focus === phase.key
                          ? 'bg-[#006747]/15 border-[#006747] text-[#006747] shadow-[0_0_15px_rgba(0,103,71,0.1)]'
                          : 'bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                      }`}
                    >
                      {phase.label}
                    </button>
                  ))}
                </div>
              </div>

              {saveError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs font-bold">
                  {saveError}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-12 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleSkipStep}
              className="text-zinc-500 hover:text-white text-sm font-bold transition-colors cursor-pointer"
            >
              Skip {step === 4 ? 'Assessment' : 'Step'}
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              disabled={saving || !!(step === 1 && username && !usernameAvailable && usernameError !== null)}
              className="px-8 py-3.5 bg-white text-black font-bold rounded-2xl text-sm hover:bg-zinc-200 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="animate-spin text-black" size={16} />
              ) : step === 4 ? (
                'Done'
              ) : (
                <>Next <ChevronRight size={14} /></>
              )}
            </button>
          </div>

        </div>
      </FlowScreen>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#09090B] text-white">
        <Loader2 className="animate-spin text-[#006747]" size={40} />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
