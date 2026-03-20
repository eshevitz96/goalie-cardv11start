import { 
  GoalieContext, 
  GoalieCardV11ViewModel, 
  GoalieCardContent,
  SupportedSport
} from "@/types/goalie-v11";

/**
 * V11 Algorithm Engine
 * Drives the messaging and coach protocols based on GoalieContext
 */
export const v11Engine = {
  /**
   * Generates a holistic view model for the Goalie Card V11 Dashboard
   */
  generateViewModel(context: GoalieContext): GoalieCardV11ViewModel {
    const readinessScore = this.calculateReadiness(context);
    const heroAction = this.determineHeroAction(context, readinessScore);
    
    return {
      headerTitle: this.generateHeaderTitle(context, readinessScore),
      readinessScore,
      sleepScore: context.readiness.sleepQuality * 10, // Scale to 100
      nutritionStatus: this.getNutritionStatus(context),
      recoveryStatus: this.calculateRecoveryStatus(readinessScore),
      heroAction,
      exploreGrid: this.generateExploreGrid(context),
      trainingPlan: {
        currentProgress: 65,
        nextSession: 'Technical Drill',
        timeRemaining: '15m'
      },
      activityLog: [], // To be populated from DB
      teamSchedule: [], // To be populated from DB
      goalieId: context.userId,
      // Stats would be fetched from DB in a real scenario
      seasonSavePercentage: 0.915,
      seasonGamesPlayed: 12,
      seasonWins: 8,
      seasonSO: 2,
      seasonGAA: 2.15
    };
  },

  /**
   * Calculate a 0-100 readiness score based on soreness and sleep
   */
  calculateReadiness(context: GoalieContext): number {
    const sorenessImpact = (10 - context.readiness.sorenessLevel) * 5; // 0-50 pts
    const sleepImpact = context.readiness.sleepQuality * 5; // 0-50 pts
    return Math.min(100, Math.max(0, sorenessImpact + sleepImpact));
  },

  /**
   * Determine the most critical action for the goalie today
   */
  determineHeroAction(context: GoalieContext, readiness: number): GoalieCardContent {
    const isGameDay = context.schedule.nextEventType === 'game';
    const isHockey = context.sport === 'hockey';
    const isSoccer = context.sport === 'soccer';
    
    // Recovery Protocol
    if (readiness < 40) {
      return {
        id: 'recovery-911',
        title: 'Active Recovery',
        type: 'physical',
        category: 'Recovery',
        description: `Your readiness is low. Focus on mobility and hydration before your next ${isHockey ? 'session' : 'match'}.`,
        durationMinutes: 20,
        energyLevel: 'low',
        targetEvent: 'any',
        thumbnailUrl: '',
        icon: 'ZapOff',
        actionUrl: '/training/recovery'
      };
    }

    // Pre-Game Protocol
    if (isGameDay) {
      return {
        id: 'pregame-warmup',
        title: 'Game Day Prep',
        type: 'mental',
        category: 'Mindset',
        description: `Visualize your tracking and stay calm in the ${isHockey ? 'crease' : isSoccer ? 'box' : 'arc'}.`,
        durationMinutes: 15,
        energyLevel: 'high',
        targetEvent: 'pre-game',
        thumbnailUrl: '',
        icon: 'Target',
        actionUrl: '/training/pre-game'
      };
    }

    // Standard Protocol
    return {
      id: 'daily-drill',
      title: 'Precision Tracking',
      type: 'film',
      category: 'Technical',
      description: `Review your save selection from the last ${isHockey ? 'period' : 'half'}.`,
      durationMinutes: 30,
      energyLevel: 'neutral',
      targetEvent: 'any',
      thumbnailUrl: '',
      icon: 'Video',
      actionUrl: '/analysis'
    };
  },

  generateHeaderTitle(context: GoalieContext, readiness: number): string {
    if (readiness < 50) return "Recovery Protocol";
    let sportName = context.sport.replace('-', ' ');
    if (context.sport.includes('lacrosse') && !context.sport.includes('box')) {
      sportName = 'Lacrosse';
    }
    if (context.schedule.nextEventType === 'game') return `${sportName.toUpperCase()} Gameday`;
    return "Daily Protocol";
  },

  getNutritionStatus(context: GoalieContext) {
    return {
      hydration: 'Optimal',
      mealPlan: 'Pre-Game Load'
    };
  },

  calculateRecoveryStatus(readiness: number): 'Good' | 'Needs Attention' | 'Recovery Day' {
    if (readiness > 75) return 'Good';
    if (readiness > 45) return 'Needs Attention';
    return 'Recovery Day';
  },

  /**
   * High-Fidelity Scoring Algorithm (V11)
   * Ranks content pool based on readiness, schedules, and personalized struggles.
   */
  calculateContentScores(
      contentPool: GoalieCardContent[],
      context: GoalieContext
  ): GoalieCardContent[] {
      const currentTime = new Date();
      const nextEventTime = context.schedule.nextEventDate ? new Date(context.schedule.nextEventDate).getTime() : 0;
      const hoursToEvent = nextEventTime
          ? (nextEventTime - currentTime.getTime()) / (1000 * 60 * 60)
          : 24;

      return contentPool.map(item => {
          let score = 50; // Base score
          
          // 1. Temporal Multipliers
          if (context.schedule.nextEventType === 'game') {
              if (hoursToEvent < 4 && item.targetEvent === 'pre-game') score *= 3;
              if (hoursToEvent < 12 && item.type === 'mental') score *= 1.5;
          }
          if (context.schedule.nextEventType === 'none' && item.targetEvent === 'off-day') {
              score *= 2;
          }

          // 2. Readiness Penalties
          if (context.readiness.sorenessLevel > 7 && item.energyLevel === 'high') {
              score *= 0.2; // Avoid strenuous work if very sore
          }

          // 3. User Struggles (Personalization)
          const matchesStruggle = context.struggles.some(s =>
              item.title.toLowerCase().includes(s.toLowerCase())
          );
          if (matchesStruggle) score += 40;

          // 4. Recency Penalty (Variety)
          const lastDoneStr = context.lastCompleted[item.type];
          const lastDone = lastDoneStr ? new Date(lastDoneStr) : new Date(0);
          const hoursSinceDone = (currentTime.getTime() - lastDone.getTime()) / (1000 * 60 * 60);
          if (hoursSinceDone < 12) score -= 30;

          // 5. Event-Driven Boosts
          if (context.unchartedVideosCount > 0 && item.type === 'film') {
              score *= 2.5; // High priority to chart new footage
          }
          if (context.pendingCoachFeedbackCount > 0 && item.type === 'stats_logging') {
              score *= 3; // Critical priority to review coach feedback
          }

          return { ...item, currentScore: score };
      }).sort((a, b) => (b.currentScore || 0) - (a.currentScore || 0));
  },

  generateExploreGrid(context: GoalieContext): GoalieCardContent[] {
    // Standard V11 Content Pool
    const pool: GoalieCardContent[] = [
      {
        id: 'film-1', title: 'Chart Recent Saves/Goals', type: 'film', category: 'Analysis',
        description: 'Plot your recent saves/goals to see trends.',
        durationMinutes: 10, energyLevel: 'neutral', targetEvent: 'any',
        thumbnailUrl: '', icon: 'BarChart3', actionUrl: '/analysis'
      },
      {
        id: 'mental-1', title: 'Box Breathing', type: 'mental', category: 'Mindset',
        description: 'Lower your heart rate before the puck drops.',
        durationMinutes: 5, energyLevel: 'low', targetEvent: 'pre-game',
        thumbnailUrl: '', icon: 'ShieldCheck', actionUrl: '/training/mental'
      },
      {
        id: 'physical-1', title: 'Hip Mobility', type: 'physical', category: 'Recovery',
        description: 'Active recovery for deep edges.',
        durationMinutes: 15, energyLevel: 'low', targetEvent: 'off-day',
        thumbnailUrl: '', icon: 'Activity', actionUrl: '/training/recovery'
      },
      {
        id: 'stats-1', title: 'Review Coach Feedback', type: 'stats_logging', category: 'Coaching',
        description: 'Check latest notes from your private coach.',
        durationMinutes: 5, energyLevel: 'neutral', targetEvent: 'any',
        thumbnailUrl: '', icon: 'Zap', actionUrl: '/coaches-corner'
      }
    ];

    const scoredPool = this.calculateContentScores(pool, context);
    return scoredPool.slice(0, 3); // Top 3 personalized items
  }
};
