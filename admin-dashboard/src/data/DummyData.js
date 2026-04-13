export const employees = [
  { id: 1, name: 'John Doe', role: 'Hal Mand', email: 'john@sport.dk', status: 'Active' },
  { id: 2, name: 'Jane Smith', role: 'Cafemedarbejder', email: 'jane@sport.dk', status: 'Active' },
  { id: 3, name: 'Mike Johnson', role: 'Administration', email: 'mike@sport.dk', status: 'Active' },
  { id: 4, name: 'Sarah Wilson', role: 'Hal Mand', email: 'sarah@sport.dk', status: 'Active' },
  { id: 5, name: 'David Brown', role: 'Rengøring', email: 'david@sport.dk', status: 'Active' },
  { id: 6, name: 'Lene Jensen', role: 'Cafemedarbejder', email: 'lene@sport.dk', status: 'Active' },
  { id: 7, name: 'Thomas Bang', role: 'Hal Mand', email: 'thomas@sport.dk', status: 'Active' },
  { id: 8, name: 'Mette Frederiksen', role: 'Rengøring', email: 'mette@sport.dk', status: 'Active' },
  { id: 9, name: 'Anders Hemmingsen', role: 'Administration', email: 'anders@sport.dk', status: 'Active' },
  { id: 10, name: 'Sofie Nielsen', role: 'Cafemedarbejder', email: 'sofie@sport.dk', status: 'Active' },
  { id: 11, name: 'Kasper Hjulmand', role: 'Hal Mand', email: 'kasper@sport.dk', status: 'Active' },
  { id: 12, name: 'Louise Hansen', role: 'Rengøring', email: 'louise@sport.dk', status: 'Active' },
];

// Helper funktion til at generere mange vagter hurtigt
const generateShifts = () => {
  const generatedShifts = [];
  let idCounter = 1;

  // Vi genererer vagter for hver dag i April 2026
  for (let day = 1; day <= 30; day++) {
    const dateString = `2026-04-${day.toString().padStart(2, '0')}`;
    
    // Hver dag har et tilfældigt antal medarbejdere på arbejde (mellem 4 og 8)
    const dailyStaffCount = Math.floor(Math.random() * 5) + 4;
    const shuffledEmployees = [...employees].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < dailyStaffCount; i++) {
      const emp = shuffledEmployees[i];
      
      // Lav lidt variation i tidspunkterne
      const startHour = Math.random() > 0.5 ? 8 : 14; 
      const duration = 8;

      generatedShifts.push({
        id: idCounter++,
        employeeId: emp.id,
        date: dateString,
        startHour: startHour,
        endHour: startHour + duration,
        type: 'Vagt' // Kan bruges til styling senere
      });
    }
  }
  return generatedShifts;
};

export const shifts = generateShifts();

export const dummyEmployee = employees[0];