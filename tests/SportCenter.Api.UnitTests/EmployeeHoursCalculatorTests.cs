using System;
using System.Collections.Generic;
using System.Linq;
using FluentAssertions;
using SportCenter.Api.DTOs;
using SportCenter.Api.Models;
using SportCenter.Api.Services;
using Xunit;

namespace SportCenter.Api.UnitTests;

public class EmployeeHoursCalculatorTests
{
    [Fact]
    public void BuildOverview_ReturnsRowsAndSummaryForMatchingEmployees()
    {
        var adminRole = new Role { RoleId = 1, Name = "Administration" };
        var cleanerRole = new Role { RoleId = 2, Name = "Rengøring" };

        var employees = new List<Employee>
        {
            new Employee
            {
                EmployeeId = 1,
                FirstName = "Alice",
                LastName = "Andersen",
                EmployeeRoles = new List<EmployeeRole>
                {
                    new EmployeeRole { EmployeeId = 1, RoleId = 1, Role = adminRole }
                }
            },
            new Employee
            {
                EmployeeId = 2,
                FirstName = "Bob",
                LastName = "Berg",
                EmployeeRoles = new List<EmployeeRole>
                {
                    new EmployeeRole { EmployeeId = 2, RoleId = 2, Role = cleanerRole }
                }
            }
        };

        var shifts = new List<Shift>
        {
            new Shift
            {
                ShiftId = 1,
                EmployeeId = 1,
                ShiftCategoryId = 10,
                StartTime = new DateTime(2026, 4, 10, 8, 0, 0),
                EndTime = new DateTime(2026, 4, 10, 12, 0, 0)
            },
            new Shift
            {
                ShiftId = 2,
                EmployeeId = 1,
                ShiftCategoryId = 10,
                StartTime = new DateTime(2026, 4, 10, 13, 0, 0),
                EndTime = new DateTime(2026, 4, 10, 17, 0, 0)
            }
        };

        var overview = EmployeeHoursCalculator.BuildOverview(
            employees,
            shifts,
            new EmployeeHoursQueryDto
            {
                StartDate = new DateTime(2026, 4, 1),
                EndDate = new DateTime(2026, 4, 30)
            });

        overview.Rows.Should().HaveCount(2);
        overview.Summary.TotalEmployees.Should().Be(2);
        overview.Summary.ActiveEmployees.Should().Be(1);
        overview.Summary.EmployeesWithoutHours.Should().Be(1);
        overview.Summary.TotalShiftCount.Should().Be(2);
        overview.Summary.TotalMinutes.Should().Be(480);

        var alice = overview.Rows.Single(row => row.EmployeeId == 1);
        alice.FullName.Should().Be("Alice Andersen");
        alice.TotalMinutes.Should().Be(480);
        alice.TotalHours.Should().Be(8);
        alice.ShiftCount.Should().Be(2);
        alice.RoleName.Should().Be("Administration");
    }

    [Fact]
    public void BuildOverview_ClipsShiftToSelectedPeriod()
    {
        var employees = new List<Employee>
        {
            new Employee
            {
                EmployeeId = 1,
                FirstName = "Alice",
                LastName = "Andersen"
            }
        };

        var shifts = new List<Shift>
        {
            new Shift
            {
                ShiftId = 1,
                EmployeeId = 1,
                ShiftCategoryId = 10,
                StartTime = new DateTime(2026, 4, 10, 23, 0, 0),
                EndTime = new DateTime(2026, 4, 11, 2, 0, 0)
            }
        };

        var overview = EmployeeHoursCalculator.BuildOverview(
            employees,
            shifts,
            new EmployeeHoursQueryDto
            {
                StartDate = new DateTime(2026, 4, 11),
                EndDate = new DateTime(2026, 4, 11)
            });

        overview.Rows.Should().HaveCount(1);
        overview.Rows[0].TotalMinutes.Should().Be(120);
        overview.Rows[0].TotalHours.Should().Be(2);
    }

    [Fact]
    public void BuildOverview_ThrowsWhenStartDateIsAfterEndDate()
    {
        var employees = new List<Employee>();
        var shifts = new List<Shift>();

        var act = () => EmployeeHoursCalculator.BuildOverview(
            employees,
            shifts,
            new EmployeeHoursQueryDto
            {
                StartDate = new DateTime(2026, 4, 30),
                EndDate = new DateTime(2026, 4, 1)
            });

        act.Should().Throw<ArgumentException>()
            .WithMessage("*Startdato kan ikke være efter slutdato.*");
    }
}
