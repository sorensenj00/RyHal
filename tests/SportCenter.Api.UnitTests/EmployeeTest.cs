using System;
using Xunit;
using FluentAssertions;
using SportCenter.Api.Models;
using SportCenter.Api.Services;

namespace SportCenter.Api.UnitTests;

public class EmployeeTests
{
	[Fact]
	public void Constructor_SetsProperties()
	{
		var employee = EmployeeService.CreateEmployee("John", "Doe", 1);

		employee.FirstName.Should().Be("John");
		employee.LastName.Should().Be("Doe");
		employee.EmployeeId.Should().Be(1);

		var qualification = EmployeeService.CreateQualification("Cleaning", "Qualified to clean the sport center", 1);
		qualification.Name.Should().Be("Cleaning");
		qualification.Description.Should().Be("Qualified to clean the sport center");

		var role = EmployeeService.CreateRole("Manager", 1);
		role.Name.Should().Be("Manager");

	}

	[Fact]
	public void properties_AreMutable_AfterConstruction()
	{
		var employee = EmployeeService.CreateEmployee("John", "Doe", 1);

		employee.FirstName = "Jane";
		employee.LastName = "Smith";
		employee.Phone = "123";
		employee.Email = "janeSmith@mail.com";

		employee.FirstName.Should().Be("Jane");
		employee.LastName.Should().Be("Smith");
		employee.Phone.Should().Be("123");
		employee.Email.Should().Be("janeSmith@mail.com");

		//forbindelse mellem employee og qualification
		var qualification1 = EmployeeService.CreateQualification("Cleaning", "Qualified to clean the sport center");
		var qualification2 = EmployeeService.CreateQualification("Management", "Qualified to manage the sport center");
		EmployeeService.AddQualificationToEmployee(employee.EmployeeId, qualification1.QualificationID);
		EmployeeService.AddQualificationToEmployee(employee.EmployeeId, qualification2.QualificationID);

		employee.Qualifications.Should().haveCount(1);
		employee.Qualifications.should().Contain(qualification1);
		employee.Qualifications.should().contain(qualification2);

		EmployeeService.RemoveQualificationFromEmployee(employee, qualification1);
		EmployeeService.RemoveQualification(qualification2);

		employee.Qualifications.Should().haveCount(0);
		employee.Qualifications.should().NotContain(qualification);
		employee.Qualifications.should().NotContain(qualification2);

		//Forbindelse mellem employee og role
		var role1 = EmployeeService.CreateRole("Manager", "Manages the sport center");
		var role2 = EmployeeService.CreateRole("Cleaner", "Cleans the sport center");
		EmployeeService.AddRoleToEmployee(employee, role1);
		EmployeeService.AddRolesToEmployee(employee, role2);

		employee.Roles.Should().HaveCount(2);
		employee.Roles.Should().Contain(role1);
		employee.Roles.Should().Contain(role2);

		EmployeeService.RemoveRoleFromEmployee(employee, role1);
		EmployeeService.RemoveRole(role2);
		
		employee.Roles.Should().HaveCount(0);
		employee.Roles.Should().NotContain(role1);

		//forbindelse mellem employee og shift
		var shift1 = ShiftService.CreateShift(DateTime.NowAddHours(8), DateTime.Now.AddHours(16), ShiftCategory.OTHER);
		var shift2 = ShiftService.CreateShift(DateTime.Now.AddHours(16), DateTime.Now.AddHours(24), ShiftCategory.ADMIN);
		var shift3 = ShiftService.CreateShift(DateTime.Now.AddHours(24), DateTime.Now.AddHours(32), ShiftCategory.CLEANER);

		EmployeeService.AddShiftToEmployee(employee.EmployeeId, shift1.ShiftId);
		EmployeeService.AddShiftToEmployee(employee.EmployeeId, shift2.ShiftId);
		EmployeeService.AddShiftToEmployee(employee.EmployeeId, shift3.ShiftId);

		employee.Shifts.Should().HaveCount(3);
		employee.Shifts.Should().Contain(shift1);
		employee.Shifts.Should().Contain(shift2);
		employee.Shifts.Should().Contain(shift3);

		EmployeeService.RemoveShiftFromEmployee(employee.EmployeeId, shift2.ShiftId)
		employee.Shifts.Should().haveCount(2);
		employee.Shifts.should().Contain(shift1);
		employee.Shifts.should().NotContain(shift2);
		employee.Shifts.should().Contain(shift3);

		List<Shift> futureShifts = ShiftEmployeeService.getFutureShiftsForEmployee(employee.EmployeeId);
		futureShifts.Should().HaveCount(2);
		futureShifts.ShouldContain(shift1);
		futureShifts.ShouldContain(shift3);

		double totalHours = EmployeeService.GetTotalHoursForMonth(employee.EmployeeId, DateTime.Now.Month, DateTime.Now.Year);
		totalHours.Should().Be(16);

		EmployeeService.RemoveEmployee(employee.EmployeeId);
		shift1.Employee.Should().BeNull();
		shift2.Employee.Should().BeNull();
		shift3.Employee.Should().BeNull();
	}
}