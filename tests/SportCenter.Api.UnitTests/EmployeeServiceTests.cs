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

public class EmployeeServiceTests
{
    [Fact]
    public async Task GetAllEmployeesAsync_ReturnsEmployeesFromRepository()
    {
        var repository = new Mock<IEmployeeRepository>();
        var authProvisioning = new Mock<IEmployeeAuthProvisioningService>();
        var employees = new List<Employee>
        {
            new() { EmployeeId = 1, FirstName = "John", LastName = "Doe" },
            new() { EmployeeId = 2, FirstName = "Jane", LastName = "Smith" }
        };

        repository.Setup(x => x.GetAllEmployeesAsync()).ReturnsAsync(employees);
        var service = new EmployeeService(repository.Object, authProvisioning.Object);

        var result = await service.GetAllEmployeesAsync();

        result.Should().BeEquivalentTo(employees);
        repository.Verify(x => x.GetAllEmployeesAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateEmployeeAsync_NormalizesEmailAndInsertsEmployee()
    {
        var repository = new Mock<IEmployeeRepository>();
        var authProvisioning = new Mock<IEmployeeAuthProvisioningService>();
        var dto = new CreateEmployeeDto
        {
            FirstName = "John",
            LastName = "Doe",
            Email = " JOHN@EXAMPLE.COM ",
            Phone = "12345678",
            Birthday = new DateTime(1990, 5, 10),
            AppAccess = " Admin "
        };

        authProvisioning
            .Setup(x => x.ProvisionEmployeeAsync("john@example.com", dto.FirstName, dto.LastName, dto.Phone, "admin"))
            .ReturnsAsync(new ProvisionedSupabaseUser("user-123", "john@example.com", true));

        repository
            .Setup(x => x.InsertEmployeeAsync(It.IsAny<Employee>()))
            .ReturnsAsync((Employee employee) =>
            {
                employee.EmployeeId = 42;
                return employee;
            });

        var service = new EmployeeService(repository.Object, authProvisioning.Object);

        var result = await service.CreateEmployeeAsync(dto);

        result.EmployeeId.Should().Be(42);
        result.Email.Should().Be("john@example.com");
        result.SupabaseUserId.Should().Be("user-123");
        result.AppAccess.Should().Be("admin");
        repository.Verify(x => x.GetEmployeeByEmailAsync("john@example.com"), Times.Once);
        repository.Verify(
            x => x.InsertEmployeeAsync(It.Is<Employee>(employee =>
                employee.FirstName == dto.FirstName &&
                employee.LastName == dto.LastName &&
                employee.Email == "john@example.com" &&
                employee.Phone == dto.Phone &&
                employee.Birthday == dto.Birthday.Date &&
                employee.SupabaseUserId == "user-123" &&
                employee.AppAccess == "admin")),
            Times.Once);
    }

    [Fact]
    public async Task CreateEmployeeAsync_DoesNotProvisionAuthWhenEmployeeEmailExists()
    {
        var repository = new Mock<IEmployeeRepository>();
        var authProvisioning = new Mock<IEmployeeAuthProvisioningService>();
        repository
            .Setup(x => x.GetEmployeeByEmailAsync("john@example.com"))
            .ReturnsAsync(new Employee { EmployeeId = 1, Email = "john@example.com" });

        var service = new EmployeeService(repository.Object, authProvisioning.Object);

        var act = () => service.CreateEmployeeAsync(new CreateEmployeeDto
        {
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            Phone = "12345678",
            Birthday = new DateTime(1990, 5, 10)
        });

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*john@example.com*");
        authProvisioning.Verify(
            x => x.ProvisionEmployeeAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task UpdateEmployeeContactAsync_ReturnsFalseWhenEmployeeDoesNotExist()
    {
        var repository = new Mock<IEmployeeRepository>();
        var authProvisioning = new Mock<IEmployeeAuthProvisioningService>();
        repository.Setup(x => x.GetEmployeeByIdAsync(7)).ReturnsAsync((Employee?)null);
        var service = new EmployeeService(repository.Object, authProvisioning.Object);

        var result = await service.UpdateEmployeeContactAsync(7, new UpdateEmployeeContactDto { Email = "new@mail.com" });

        result.Should().BeFalse();
        repository.Verify(x => x.UpdateEmployeeContactAsync(It.IsAny<int>(), It.IsAny<string?>(), It.IsAny<string?>()), Times.Never);
    }

    [Fact]
    public async Task UpdateEmployeeRoleAsync_InsertsNewRoleLinkWhenEmployeeHasNoExistingRole()
    {
        var repository = new Mock<IEmployeeRepository>();
        var authProvisioning = new Mock<IEmployeeAuthProvisioningService>();
        repository.Setup(x => x.GetEmployeeByIdAsync(5)).ReturnsAsync(new Employee { EmployeeId = 5 });
        repository.Setup(x => x.GetRoleByNameAsync("Manager")).ReturnsAsync(new Role { RoleId = 9, Name = "Manager" });
        repository.Setup(x => x.GetEmployeeRoleByEmployeeIdAsync(5)).ReturnsAsync((EmployeeRole?)null);

        var service = new EmployeeService(repository.Object, authProvisioning.Object);

        var result = await service.UpdateEmployeeRoleAsync(5, new UpdateEmployeeRoleDto { RoleName = " Manager " });

        result.Should().BeTrue();
        repository.Verify(x => x.InsertEmployeeRoleAsync(It.Is<EmployeeRole>(link => link.EmployeeId == 5 && link.RoleId == 9)), Times.Once);
        repository.Verify(x => x.UpdateEmployeeRoleAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task RemoveEmployeeAsync_UnlinksRelationsBeforeDeletingEmployee()
    {
        var repository = new Mock<IEmployeeRepository>();
        var authProvisioning = new Mock<IEmployeeAuthProvisioningService>();
        repository.Setup(x => x.GetEmployeeByIdAsync(3)).ReturnsAsync(new Employee { EmployeeId = 3 });
        var service = new EmployeeService(repository.Object, authProvisioning.Object);

        var result = await service.RemoveEmployeeAsync(3);

        result.Should().BeTrue();
        repository.Verify(x => x.UnlinkShiftsFromEmployeeAsync(3), Times.Once);
        repository.Verify(x => x.DeleteEmployeeRolesByEmployeeIdAsync(3), Times.Once);
        repository.Verify(x => x.DeleteEmployeeQualificationsByEmployeeIdAsync(3), Times.Once);
        repository.Verify(x => x.DeleteEmployeeAsync(3), Times.Once);
    }

    [Fact]
    public async Task GetTotalHoursForMonthAsync_UsesCalculatorForSelectedMonth()
    {
        var repository = new Mock<IEmployeeRepository>();
        var authProvisioning = new Mock<IEmployeeAuthProvisioningService>();
        repository.Setup(x => x.GetShiftsForEmployeeAsync(1)).ReturnsAsync(new List<Shift>
        {
            new() { ShiftId = 1, EmployeeId = 1, StartTime = new DateTime(2026, 4, 1, 8, 0, 0), EndTime = new DateTime(2026, 4, 1, 16, 0, 0) },
            new() { ShiftId = 2, EmployeeId = 1, StartTime = new DateTime(2026, 5, 1, 8, 0, 0), EndTime = new DateTime(2026, 5, 1, 12, 0, 0) }
        });

        var service = new EmployeeService(repository.Object, authProvisioning.Object);

        var result = await service.GetTotalHoursForMonthAsync(1, 4, 2026);

        result.Should().Be(8);
    }
}
