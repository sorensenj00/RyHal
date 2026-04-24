using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FluentAssertions;
using Moq;
using SportCenter.Api.DTOs;
using SportCenter.Api.Models;
using SportCenter.Api.Services;
using Xunit;

namespace SportCenter.Api.UnitTests;

public class EmployeeTests
{
    [Fact]
    public async Task GetAllEmployeesAsync_ReturnsEmployeesFromRepository()
    {
        var repository = new Mock<IEmployeeRepository>();
        var employees = new List<Employee>
        {
            new() { EmployeeId = 1, FirstName = "John", LastName = "Doe" },
            new() { EmployeeId = 2, FirstName = "Jane", LastName = "Smith" }
        };

        repository.Setup(x => x.GetAllEmployeesAsync()).ReturnsAsync(employees);
        var service = new EmployeeService(repository.Object);

        var result = await service.GetAllEmployeesAsync();

        result.Should().BeEquivalentTo(employees);
        repository.Verify(x => x.GetAllEmployeesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateEmployeeAsync_MapsDtoAndReturnsCreatedEmployee()
    {
        var repository = new Mock<IEmployeeRepository>();
        var dto = new CreateEmployeeDto
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            Phone = "12345678",
            Birthday = new DateTime(1990, 5, 10)
        };

        repository
            .Setup(x => x.InsertEmployeeAsync(It.IsAny<Employee>()))
            .ReturnsAsync((Employee employee) =>
            {
                employee.EmployeeId = 42;
                return employee;
            });

        var service = new EmployeeService(repository.Object);

        var result = await service.CreateEmployeeAsync(dto);

        result.EmployeeId.Should().Be(42);
        result.FirstName.Should().Be(dto.FirstName);
        result.LastName.Should().Be(dto.LastName);
        result.Email.Should().Be(dto.Email);
        result.Phone.Should().Be(dto.Phone);
        result.Birthday.Should().Be(DateOnly.FromDateTime(dto.Birthday));
        repository.Verify(
            x => x.InsertEmployeeAsync(It.Is<Employee>(employee =>
                employee.FirstName == dto.FirstName &&
                employee.LastName == dto.LastName &&
                employee.Email == dto.Email &&
                employee.Phone == dto.Phone &&
                employee.Birthday == DateOnly.FromDateTime(dto.Birthday))),
            Times.Once);
    }

    [Fact]
    public async Task UpdateEmployeeContactAsync_ReturnsFalseWhenEmployeeDoesNotExist()
    {
        var repository = new Mock<IEmployeeRepository>();
        repository.Setup(x => x.GetEmployeeByIdAsync(7)).ReturnsAsync((Employee?)null);
        var service = new EmployeeService(repository.Object);

        var result = await service.UpdateEmployeeContactAsync(7, new UpdateEmployeeContactDto { Email = "new@mail.com" });

        result.Should().BeFalse();
        repository.Verify(x => x.UpdateEmployeeContactAsync(It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<string?>()), Times.Never);
    }

    [Fact]
    public async Task UpdateEmployeeRoleAsync_InsertsNewRoleLinkWhenEmployeeHasNoExistingRole()
    {
        var repository = new Mock<IEmployeeRepository>();
        repository.Setup(x => x.GetEmployeeByIdAsync(5)).ReturnsAsync(new Employee { EmployeeId = 5 });
        repository.Setup(x => x.GetRoleByNameAsync("Manager")).ReturnsAsync(new Role { RoleId = 9, Name = "Manager" });
        repository.Setup(x => x.GetEmployeeRoleByEmployeeIdAsync(5)).ReturnsAsync((EmployeeRole?)null);

        var service = new EmployeeService(repository.Object);

        var result = await service.UpdateEmployeeRoleAsync(5, new UpdateEmployeeRoleDto { RoleName = "Manager" });

        result.Should().BeTrue();
        repository.Verify(x => x.InsertEmployeeRoleAsync(It.Is<EmployeeRole>(link => link.EmployeeId == 5 && link.RoleId == 9)), Times.Once);
        repository.Verify(x => x.UpdateEmployeeRoleAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task RemoveEmployeeAsync_UnlinksRelationsBeforeDeletingEmployee()
    {
        var repository = new Mock<IEmployeeRepository>();
        repository.Setup(x => x.GetEmployeeByIdAsync(3)).ReturnsAsync(new Employee { EmployeeId = 3 });
        var service = new EmployeeService(repository.Object);

        var result = await service.RemoveEmployeeAsync(3);

        result.Should().BeTrue();
        repository.Verify(x => x.UnlinkShiftsFromEmployeeAsync(3), Times.Once);
        repository.Verify(x => x.DeleteEmployeeRolesByEmployeeIdAsync(3), Times.Once);
        repository.Verify(x => x.DeleteEmployeeQualificationsByEmployeeIdAsync(3), Times.Once);
        repository.Verify(x => x.DeleteEmployeeAsync(3), Times.Once);
    }

    [Fact]
    public async Task GetTotalHoursForMonthAsync_SumsOnlyMatchingMonth()
    {
        var repository = new Mock<IEmployeeRepository>();
        repository.Setup(x => x.GetShiftsForEmployeeAsync(1)).ReturnsAsync(new List<Shift>
        {
            new() { ShiftId = 1, StartTime = new DateTime(2026, 4, 1, 8, 0, 0), EndTime = new DateTime(2026, 4, 1, 16, 0, 0) },
            new() { ShiftId = 2, StartTime = new DateTime(2026, 4, 2, 9, 0, 0), EndTime = new DateTime(2026, 4, 2, 13, 0, 0) },
            new() { ShiftId = 3, StartTime = new DateTime(2026, 5, 1, 8, 0, 0), EndTime = new DateTime(2026, 5, 1, 12, 0, 0) }
        });

        var service = new EmployeeService(repository.Object);

        var result = await service.GetTotalHoursForMonthAsync(1, 4, 2026);

        result.Should().Be(12);
    }
}
