// Simpel in-memory storage for aktiviteter
let activities = [
  { 
      id: 1, title: 'Fodboldturnering', description: 'Årlig turnering for lokalområdet.', 
      startDate: '2026-05-20', startTime: '10:00', endTime: '15:00', isRecurring: false 
  },
  { 
      id: 2, title: 'Yoga Hold', description: 'Aftenyoga session.', 
      startDate: '2026-06-15', startTime: '19:00', endTime: '20:00', 
      isRecurring: true, recurrenceFrequency: 'Weekly', recurrenceEndDate: '2026-06-29',
      occurrences: [
          { date: '2026-06-15', startTime: '19:00', endTime: '20:00' },
          { date: '2026-06-22', startTime: '19:00', endTime: '20:00' },
          { date: '2026-06-29', startTime: '19:00', endTime: '20:00' }
      ]
  }
];

export const getActivities = (type) => {
    if (type === 'recurring') {
        return activities.filter(a => a.isRecurring);
    } else if (type === 'single') {
        return activities.filter(a => !a.isRecurring);
    }
    return [...activities];
};

export const deleteActivity = (id) => {
    activities = activities.filter(a => a.id !== id);
};

export const addActivity = (activity) => {
    let occurrences = [];
    
    // Mock generering af occurrences hvis gentagende
    if (activity.isRecurring && activity.recurrenceEndDate) {
        let currentDate = new Date(activity.startDate);
        let endDate = new Date(activity.recurrenceEndDate);
        
        while (currentDate <= endDate) {
            occurrences.push({
                date: currentDate.toISOString().split('T')[0],
                startTime: activity.startTime,
                endTime: activity.endTime
            });
            
            if (activity.recurrenceFrequency === 'Daily') {
                currentDate.setDate(currentDate.getDate() + 1);
            } else if (activity.recurrenceFrequency === 'Weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (activity.recurrenceFrequency === 'Monthly') {
                currentDate.setMonth(currentDate.getMonth() + 1);
            } else {
                break;
            }
        }
    }

    const newActivity = {
        ...activity,
        id: activities.length > 0 ? Math.max(...activities.map(a => a.id)) + 1 : 1,
        occurrences: occurrences
    };
    activities.push(newActivity);
    return newActivity;
};
