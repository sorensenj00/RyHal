export const employees = [
  { 
    id: 1, 
    firstName: 'John', 
    lastName: 'Doe', 
    role: 'Hal Mand', 
    email: 'john@sport.dk', 
    phone: '12345678', 
    isOver18: true, 
    age: '1985-05-15T00:00:00',
    status: 'Active',
    qualifications: [
      { name: 'Førstehjælp', description: 'Udvidet kursus i livreddende førstehjælp (2024)' },
      { name: 'Truckcertifikat', description: 'Kategori B gaffeltruck' }
    ]
  },
  { 
    id: 2, 
    firstName: 'Jane', 
    lastName: 'Smith', 
    role: 'Cafemedarbejder', 
    email: 'jane@sport.dk', 
    phone: '23456789', 
    isOver18: true, 
    age: '1992-10-22T00:00:00',
    status: 'Active',
    qualifications: [
      { name: 'Hygiejnebevis', description: 'Lovpligtigt certifikat til fødevarehåndtering' }
    ]
  },
  { 
    id: 3, 
    firstName: 'Mike', 
    lastName: 'Johnson', 
    role: 'Administration', 
    email: 'mike@sport.dk', 
    phone: '34567890', 
    isOver18: true, 
    age: '1978-03-12T00:00:00',
    status: 'Active',
    qualifications: []
  },
  { 
    id: 4, 
    firstName: 'Sarah', 
    lastName: 'Wilson', 
    role: 'Hal Mand', 
    email: 'sarah@sport.dk', 
    phone: '45678901', 
    isOver18: true, 
    age: '1995-08-30T00:00:00',
    status: 'Active',
    qualifications: [
      { name: 'Brandbekæmpelse', description: 'Kursus i elementær brandslukning' }
    ]
  },
  { 
    id: 5, 
    firstName: 'David', 
    lastName: 'Brown', 
    role: 'Rengøring', 
    email: 'david@sport.dk', 
    phone: '56789012', 
    isOver18: true, 
    age: '1988-12-05T00:00:00',
    status: 'Active',
    qualifications: []
  },
  { 
    id: 6, 
    firstName: 'Lene', 
    lastName: 'Jensen', 
    role: 'Cafemedarbejder', 
    email: 'lene@sport.dk', 
    phone: '67890123', 
    isOver18: true, 
    age: '1975-06-18T00:00:00',
    status: 'Active',
    qualifications: [
      { name: 'Hygiejnebevis', description: 'Lovpligtigt certifikat til fødevarehåndtering' },
      { name: 'Barista kursus', description: 'Specialist i kaffebrygning' }
    ]
  },
  { 
    id: 7, 
    firstName: 'Thomas', 
    lastName: 'Bang', 
    role: 'Hal Mand', 
    email: 'thomas@sport.dk', 
    phone: '78901234', 
    isOver18: true, 
    age: '1990-01-14T00:00:00',
    status: 'Active',
    qualifications: [
      { name: 'Førstehjælp', description: 'Basis førstehjælp' }
    ]
  },
  { 
    id: 8, 
    firstName: 'Mette', 
    lastName: 'Frederiksen', 
    role: 'Rengøring', 
    email: 'mette@sport.dk', 
    phone: '89012345', 
    isOver18: true, 
    age: '1982-04-01T00:00:00',
    status: 'Active',
    qualifications: []
  },
  { 
    id: 9, 
    firstName: 'Anders', 
    lastName: 'Hemmingsen', 
    role: 'Administration', 
    email: 'anders@sport.dk', 
    phone: '90123456', 
    isOver18: true, 
    age: '1987-11-11T00:00:00',
    status: 'Active',
    qualifications: []
  },
  { 
    id: 10, 
    firstName: 'Sofie', 
    lastName: 'Nielsen', 
    role: 'Cafemedarbejder', 
    email: 'sofie@sport.dk', 
    phone: '01234567', 
    isOver18: false, 
    age: '2009-02-20T00:00:00',
    status: 'Active',
    qualifications: []
  },
  { 
    id: 11, 
    firstName: 'Kasper', 
    lastName: 'Hjulmand', 
    role: 'Hal Mand', 
    email: 'kasper@sport.dk', 
    phone: '12345670', 
    isOver18: true, 
    age: '1972-04-09T00:00:00',
    status: 'Active',
    qualifications: [
      { name: 'Livredderpas', description: 'Gyldigt til svømmehalsovervågning' }
    ]
  },
  { 
    id: 12, 
    firstName: 'Louise', 
    lastName: 'Hansen', 
    role: 'Rengøring', 
    email: 'louise@sport.dk', 
    phone: '23456781', 
    isOver18: true, 
    age: '1999-07-25T00:00:00',
    status: 'Active',
    qualifications: []
  },
];

// Helper funktion til at generere mange vagter hurtigt
const generateShifts = () => {
  const generatedShifts = [];
  let idCounter = 1;

  for (let day = 1; day <= 30; day++) {
    const dateString = `2026-04-${day.toString().padStart(2, '0')}`;
    const dailyStaffCount = Math.floor(Math.random() * 5) + 4;
    const shuffledEmployees = [...employees].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < dailyStaffCount; i++) {
      const emp = shuffledEmployees[i];
      const startHour = Math.random() > 0.5 ? 8 : 14; 
      const duration = 8;

      generatedShifts.push({
        id: idCounter++,
        employeeId: emp.id,
        date: dateString,
        startHour: startHour,
        endHour: startHour + duration,
        category: emp.role, 
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${(startHour + duration).toString().padStart(2, '0')}:00`
      });
    }
  }
  return generatedShifts;
};

export const shifts = generateShifts();
export const dummyEmployee = employees[0]; // John Doe
