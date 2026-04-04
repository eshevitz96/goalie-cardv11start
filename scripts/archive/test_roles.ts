
import { isPastSeniorSeason } from '@/utils/role-logic';

const scenarios = [
    { name: 'Pro Goalie (Old Grad Year)', gradYear: 2015, team: 'Boston Bruins' },
    { name: 'College Goalie (Recent Grad)', gradYear: 2024, team: 'Yale' }, // Assuming currently 2026, 2024 is past
    { name: 'High School Goalie (Future Grad)', gradYear: 2027, team: 'Local HS' },
    { name: 'Middle School Goalie (Far Future Grad)', gradYear: 2031, team: 'Local MS' },
];

console.log("Current Date:", new Date().toISOString());

scenarios.forEach(scenario => {
    const isPast = isPastSeniorSeason(scenario.gradYear);
    // Logic from src/app/goalie/page.tsx
    // const isPro = activeGoalie && activeGoalie.gradYear && (isPastSeniorSeason(activeGoalie.gradYear) || activeGoalie.team?.toLowerCase().includes('blue') || activeGoalie.team?.toLowerCase().includes('pro'));

    // Simulating the page logic
    const team = scenario.team.toLowerCase();
    const isPro = isPast || team.includes('blue') || team.includes('pro');

    console.log(`\nScenario: ${scenario.name}`);
    console.log(`  Grad Year: ${scenario.gradYear}`);
    console.log(`  Team: ${scenario.team}`);
    console.log(`  isPastSeniorSeason: ${isPast}`);
    console.log(`  Resulting UI Mode: ${isPro ? 'PRO / COLLEGE (Hidden Progress)' : 'YOUTH (Show Progress)'}`);
});
