// Levels and badges are derived purely from the /api/users/profile response,
// so they need no extra storage and the mobile app's API stays untouched.

export const LEVELS = [
  { min: 0, title: 'Hatchling' },
  { min: 10, title: 'Nestling' },
  { min: 25, title: 'Fledgling' },
  { min: 50, title: 'Glider' },
  { min: 100, title: 'Sky Scout' },
  { min: 200, title: 'Hunter' },
  { min: 350, title: 'Sharp Eye' },
  { min: 500, title: 'Talon' },
  { min: 750, title: 'Storm Rider' },
  { min: 1000, title: 'Apex Hawk' },
  { min: 1500, title: 'Sky Sovereign' },
  { min: 2500, title: 'Legend of the Sky' },
];

export function getLevel(points) {
  let index = 0;
  LEVELS.forEach((level, i) => {
    if (points >= level.min) index = i;
  });

  const current = LEVELS[index];
  const next = LEVELS[index + 1] || null;
  const progress = next ? (points - current.min) / (next.min - current.min) : 1;

  return { level: index + 1, title: current.title, min: current.min, next, progress };
}

function longestStreak(activityMap) {
  const days = Object.keys(activityMap)
    .filter(day => activityMap[day] > 0)
    .map(day => Date.parse(`${day}T00:00:00Z`) / 86400000)
    .sort((a, b) => a - b);

  let best = 0;
  let run = 0;
  days.forEach((day, i) => {
    run = i > 0 && day - days[i - 1] === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

export function getBadges(profile) {
  const activityMap = profile.activityMap || {};
  const timeline = profile.timeline || [];
  const points = Math.max(0, profile.user.orbitPoints || 0);
  const friends = profile.friendCount ?? 0;
  const wins = profile.completedChallengesCount ?? 0;
  const bestStreak = Math.max(longestStreak(activityMap), profile.streak ?? 0);
  const activeDays = Object.values(activityMap).filter(count => count > 0).length;
  const habits = timeline.filter(item => item.type === 'habit').length;
  const completed = timeline.filter(item => item.type !== 'challenge').length;

  return [
    { id: 'first-flight', icon: 'flight_takeoff', name: 'First Flight', desc: 'Complete your first task', value: completed, goal: 1 },
    { id: 'streak-3', icon: 'local_fire_department', name: 'Warming Up', desc: 'Hit a 3-day streak', value: bestStreak, goal: 3 },
    { id: 'streak-7', icon: 'whatshot', name: 'On Fire', desc: 'Hit a 7-day streak', value: bestStreak, goal: 7 },
    { id: 'streak-30', icon: 'bolt', name: 'Unstoppable', desc: 'Hit a 30-day streak', value: bestStreak, goal: 30 },
    { id: 'habits-50', icon: 'cycle', name: 'Creature of Habit', desc: 'Check off 50 habits', value: habits, goal: 50 },
    { id: 'tasks-100', icon: 'task_alt', name: 'Century', desc: 'Complete 100 tasks and habits', value: completed, goal: 100 },
    { id: 'first-win', icon: 'emoji_events', name: 'First Win', desc: 'Complete your first challenge', value: wins, goal: 1 },
    { id: 'wins-10', icon: 'military_tech', name: 'Champion', desc: 'Complete 10 challenges', value: wins, goal: 10 },
    { id: 'friends-1', icon: 'group', name: 'Flock Up', desc: 'Add your first friend', value: friends, goal: 1 },
    { id: 'friends-10', icon: 'diversity_3', name: 'Lead the Flock', desc: 'Have 10 friends', value: friends, goal: 10 },
    { id: 'active-100', icon: 'calendar_month', name: 'Regular', desc: 'Be active on 100 different days', value: activeDays, goal: 100 },
    { id: 'points-500', icon: 'stars', name: 'Talon Tier', desc: 'Earn 500 points', value: points, goal: 500 },
  ].map(badge => ({ ...badge, unlocked: badge.value >= badge.goal }));
}
