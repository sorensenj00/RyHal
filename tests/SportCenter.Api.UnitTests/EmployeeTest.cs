using System;
using Xunit;
using FluentAssertions;
using SportCenter.Api.Models;

namespace SportCenter.Api.UnitTests;

public class EmployeeTests
{
	[Fact]
	public void Constructor_SetsProperties()
	{
		var employee = EmployeeService.createEmployee("John", "Doe");

		employee.FirstName.Should().Be("John");
		employee.LastName.Should().Be("Doe");

		var qualification EmployeeService.CreateQualification("Cleaning", "Qualified to clean the sport center");
		qualification.Name.Should().Be("Cleaning");
		qualification.Description.Should().Be("Qualified to clean the sport center");

		var role = EmployeeService.CreateRole("Manager", "Manages the sport center");
		role.Name.Should().Be("Manager");
		role.Description.Should().Be("Manages the sport center");

	}

	[Fact]
	public void properties_AreMutable_AfterConstruction()
	{
		var employee = EmployeeService.createEmployee("John", "Doe");

		employee.FirstName = "Jane";
		employee.LastName = "Smith";
		employee.Phone ="123"
		employee.Email = "janeSmith@mail.com";

		employee.FirstName.Should().Be("Jane");
		employee.LastName.Should().Be("Smith");
		employee.Phone.Should().Be("123");
		employee.Email.Should().Be("janeSmith@mail.com");

		//forbindelse mellem employee og qualification
		var qualification = EmployeeService.CreateQualification("Cleaning", "Qualified to clean the sport center");
		EmployeeService.AddQualificationToEmployee(employee, qualification);

		employee.Qualifications.Should().haveCount(1);
		employee.Qualifications.should().Contain(qualification);

		EmployeeService.RemoveQualificationFromEmployee(employee, qualification);

		employee.Qualifications.Should().haveCount(0);
		employee.Qualifications.should().NotContain(qualification);

		//Forbindelse mellem employee og role
		var role =EmployeeService.CreateRole("Manager", "Manages the sport center");
		EmployeeService.AddRoleToEmployee(employee, role);

		employee.Roles.Should().haveCount(1);
		employee.Roles.Should().Contain(role);

		EmployeeService.RemoveRoleFromEmployee(employee, role);
		
		employee.Roles.Should().haveCount(0);
		employee.Roles.Should().NotContain(role);

		//forbindelse mellem employee og shift
		var shift1 = new Shift(DateTime.NowAddHours(8), DateTime.Now.AddHours(16), ShiftCategory.OTHER);
		var shift2 = new Shift(DateTime.Now.AddHours(16), DateTime.Now.AddHours(24), ShiftCategory.ADMIN);
		var shift3 = new Shift(DateTime.Now.AddHours(24), DateTime.Now.AddHours(32), ShiftCategory.CLEANER);

		EmployeeService.AddShiftToEmployee(employee.EmployeeId, shift1.ShiftId)
		EmployeeService.AddShiftToEmployee(employee.EmployeeId, shift2.ShiftId)
		EmployeeService.AddShiftToEmployee(employee.EmployeeId, shift3.ShiftId)

		employee.Shifts.Should().haveCount(3);
		employee.Shifts.should().Contain(shift1);
		employee.Shifts.should().Contain(shift2);
		employee.Shifts.should().Contain(shift3);


		EmployeeService.removeShiftFromEmployee(employee.EmployeeId, shift2.ShiftId)
		employee.Shifts.Should().haveCount(2);
		employee.Shifts.should().Contain(shift1);
		employee.Shifts.should().NotContain(shift2);
		employee.Shifts.should().Contain(shift3);

		List<Shift> futureShifts = ShiftEmployeeService.getFutureShiftsForEmployee(employee.EmployeeId);
		futureShifts.Should().HaveCount(2);
		futureShifts.ShouldContain(shift1);
		futureShifts.ShouldContain(shift3);

		double totalHours = EmployeeService.getTotalHoursForMonth(employee.EmployeeId, DateTime.Now.Month, DateTime.Now.Year);
		totalHours.Should().Be(16);

		EmployeeService.removeEmployee(employee.EmployeeId);
		shift1.Employee.Should().BeNull();
		shift2.Employee.Should().BeNull();
		shift3.Employee.Should().BeNull();
	}
}