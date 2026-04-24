using System;
using FluentAssertions;
using SportCenter.Api.Models;
using Xunit;

namespace SportCenter.Api.UnitTests;

public class ShiftTests
{
    [Fact]
    public void Constructor_SetsProperties()
    {
        var start = DateTime.Today.AddHours(8);
        var end = DateTime.Today.AddHours(16);
        var category = new ShiftCategory
        {
            ShiftCategoryId = 3,
            Name = "Cleaner",
            Color = "#00AAFF"
        };

        var shift = new Shift
        {
            ShiftId = 1,
            StartTime = start,
            EndTime = end,
            EmployeeId = 7,
            ShiftCategoryId = category.ShiftCategoryId,
            Category = category
        };

        shift.ShiftId.Should().Be(1);
        shift.StartTime.Should().Be(start);
        shift.EndTime.Should().Be(end);
        shift.EmployeeId.Should().Be(7);
        shift.ShiftCategoryId.Should().Be(3);
        shift.Category.Should().BeSameAs(category);
    }

    [Fact]
    public void Properties_AreMutable_AfterConstruction()
    {
        var shift = new Shift
        {
            ShiftId = 1,
            StartTime = DateTime.Today.AddHours(8),
            EndTime = DateTime.Today.AddHours(16),
            EmployeeId = 7,
            ShiftCategoryId = 1
        };

        var newCategory = new ShiftCategory
        {
            ShiftCategoryId = 2,
            Name = "Admin",
            Color = "#222222"
        };

        var newStart = DateTime.Today.AddHours(9);
        var newEnd = DateTime.Today.AddHours(17);

        shift.StartTime = newStart;
        shift.EndTime = newEnd;
        shift.EmployeeId = null;
        shift.ShiftCategoryId = newCategory.ShiftCategoryId;
        shift.Category = newCategory;

        shift.StartTime.Should().Be(newStart);
        shift.EndTime.Should().Be(newEnd);
        shift.EmployeeId.Should().BeNull();
        shift.ShiftCategoryId.Should().Be(2);
        shift.Category.Should().BeSameAs(newCategory);
    }
}
