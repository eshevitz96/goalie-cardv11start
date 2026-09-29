// Live Database Types generated from Supabase project qqplpiurnrsrbqttsffd

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string | null;
          auth_user_id: string | null;
          first_name: any;
          last_name: any;
          display_name: any;
          email: string | null;
          role: string | null;
          date_of_birth: any;
          grad_year: any;
          primary_sport: any;
          handedness: any;
          created_at: string | null;
          updated_at: string | null;
          username: any;
          username_changed_at: any;
          is_over_18: boolean | null;
          consent_agreed: boolean | null;
          consent_agreed_at: any;
          parent_email: any;
          parent_phone: any;
          onboarding_completed: boolean | null;
          onboarding_completed_at: any;
          gc_number: number | null;
          stripe_customer_id: any;
          teams: any;
          profile_tags: any;
          height: any;
          gpa: any;
          digital_signature: any;
        };
      };
      contracts: {
        Row: {
          id: string | null;
          user_id: string | null;
          name: string | null;
          objective: string | null;
          bottlenecks: any[] | null;
          status: string | null;
          created_at: string | null;
          coach_id: any;
          template_id: any;
          stripe_subscription_id: any;
          stripe_customer_id: any;
          auto_renew: boolean | null;
          phase: string | null;
          start_date: string | null;
        };
      };
      daily_morning_entries: {
        Row: {
          id: string | null;
          session_id: string | null;
          created_at: string | null;
          mood: string | null;
          whats_bouncing: any;
          intention: string | null;
        };
      };
      daily_sessions: {
        Row: {
          id: string | null;
          user_id: string | null;
          created_at: string | null;
          session_date: string | null;
          day_types: any[] | null;
          season_id: string | null;
        };
      };
      daily_users: {
        Row: {
          id: string | null;
          created_at: string | null;
          name: string | null;
          dob: any;
          sport: string | null;
          season: any;
          team: any;
          email: any;
        };
      };
      training_sessions: {
        Row: {
          id: string | null;
          user_id: string | null;
          team_id: any;
          season_id: any;
          session_date: string | null;
          training_type: string | null;
          title: string | null;
          status: string | null;
          duration_minutes: any;
          notes_summary: any;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      missions: {
        Row: {
          id: string | null;
          user_id: string | null;
          contract_id: string | null;
          mission_date: string | null;
          day_number: number | null;
          title: string | null;
          directive: string | null;
          bottleneck: string | null;
          readiness: Record<string, any> | null;
          blocks: Record<string, any> | null;
          status: string | null;
          completed_at: any;
          created_at: string | null;
          source: string | null;
          program_id: any;
        };
      };
      events: {
        Row: {
          id: string | null;
          name: string | null;
          date: string | null;
          location: string | null;
          status: string | null;
          image: any;
          created_at: string | null;
          price: number | null;
          access_code: any;
          sport: string | null;
          created_by: string | null;
          scouting_report: string | null;
          video_url: any;
          is_charted: boolean | null;
          roster_id: any;
          scouting_clips: any[] | null;
        };
      };
      reflections: {
        Row: {
          [key: string]: any;
        };
      };
      roster_uploads: {
        Row: {
          id: string | null;
          email: string | null;
          goalie_name: string | null;
          parent_name: any;
          parent_phone: string | null;
          grad_year: any;
          team: string | null;
          assigned_unique_id: any;
          is_claimed: boolean | null;
          payment_status: string | null;
          amount_paid: number | null;
          created_at: string | null;
          assigned_coach_id: any;
          height: any;
          weight: any;
          catch_hand: any;
          session_count: number | null;
          lesson_count: number | null;
          assigned_coach_ids: any[] | null;
          raw_data: Record<string, any> | null;
          sport: string | null;
          birthday: any;
          guardian_email: string | null;
          athlete_email: string | null;
          guardian_phone: string | null;
          athlete_phone: string | null;
          linked_user_id: any;
          updated_at: string | null;
          access_pin: any;
          team_id: any;
          is_pro: boolean | null;
        };
      };
      coach_profiles: {
        Row: {
          id: string | null;
          display_name: string | null;
          bio: any;
          stripe_account_id: any;
          is_verified: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      contract_templates: {
        Row: {
          id: string | null;
          coach_id: string | null;
          name: string | null;
          description: string | null;
          price_monthly_cents: number | null;
          film_reviews_per_month: number | null;
          includes_sync: boolean | null;
          is_active: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
      credit_transactions: {
        Row: {
          [key: string]: any;
        };
      };
      game_sessions: {
        Row: {
          id: string | null;
          game_id: string | null;
          user_id: string | null;
          team_id: any;
          season_id: any;
          status: string | null;
          started_at: any;
          completed_at: any;
          shots_faced: number | null;
          saves: number | null;
          goals_allowed: number | null;
          save_pct: number | null;
          notes_summary: any;
          created_at: string | null;
          updated_at: string | null;
          opponent: string | null;
          location: string | null;
          scheduled_date: string | null;
          scheduled_time: any;
          game_type: string | null;
        };
      };
      performance_index_snapshots: {
        Row: {
          id: string | null;
          user_id: string | null;
          season_id: string | null;
          source_type: string | null;
          source_id: string | null;
          score_before: number | null;
          score_after: number | null;
          score_delta: number | null;
          stability_score: number | null;
          execution_score: number | null;
          readiness_score: number | null;
          summary_label: string | null;
          summary_reason: any;
          ruleset_version: string | null;
          created_at: string | null;
        };
      };
      seasons: {
        Row: {
          id: string | null;
          user_id: string | null;
          team_id: any;
          name: string | null;
          sport: string | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean | null;
          created_at: string | null;
        };
      };
      weekly_intentions: {
        Row: {
          id: string | null;
          user_id: string | null;
          week_start_date: string | null;
          intention_text: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
      };
    };
  };
}
