import React from 'react';
import defaultAvatar from '../../Assets/images/default-avatar.png';

// Vi tager imod 'employees' listen fra overkomponenten for at undgå for mange API-kald
function DisplayEmployeeNameAndImage({ employeeId, employees = [] }) {
    
    // Find medarbejderen i listen (vi bruger employeeId som i databasen)
    const employee = employees.find(emp => emp.employeeId === employeeId);

    if (!employee) {
        return (
            <div className="employee-info">
                <img src={defaultAvatar} alt="Default" className="employee-image" />
                <span className="employee-name">Ledig</span>
            </div>
        );
    }

    return (
        <div className="employee-info">
            <img 
                src={employee.image || defaultAvatar} 
                alt={`${employee.firstName}'s profile`} 
                className="employee-image" 
            />
            <span className="employee-name">{employee.firstName}</span>
        </div>
    );
}

export default DisplayEmployeeNameAndImage;
