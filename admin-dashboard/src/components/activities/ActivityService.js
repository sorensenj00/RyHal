// Simpel in-memory storage for aktiviteter
let activities = [
  { id: 1, title: 'Fodboldturnering', description: 'Årlig turnering for lokalområdet.', date: '2026-05-20' },
  { id: 2, title: 'Yoga Hold', description: 'Aftenyoga session.', date: '2026-06-15' }
];

export const getActivities = () => {
    // Returnerer en kopi af arrayet for at beskytte den interne state mod direkte mutationer
    return [...activities];
};

export const addActivity = (activity) => {
    const newActivity = {
        ...activity,
        id: activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1
    };
    activities.push(newActivity);
    return newActivity;
};
