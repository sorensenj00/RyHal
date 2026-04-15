import {employees} from '../../data/DummyData';
import defaultAvatar from '../../Assets/images/default-avatar.png';

function DisplayEmployeeNameAndImage({employeeId}) {
    const employee = employees.find(emp => emp.id === employeeId);

    if (!employee) {
        return <div>Employee not found</div>;
    }

    return (
        <div className="employee-info">
            <img src={employee.image || defaultAvatar} alt={`${employee.firstName}'s profile`} className="employee-image" />
            <span className="employee-name">{employee.firstName}</span>
        </div>
    );
}