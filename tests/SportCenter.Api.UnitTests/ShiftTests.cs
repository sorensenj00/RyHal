using System;
using Xunit;
using FluentAssertions;
using SportCenter.Api.Models;

namespace SportCenter.Api.UnitTests;

public class ShiftTests
{
    [Fact]
    public void Constructor_SetsProperties()
    {
        var date = DateOnly.FromDateTime(DateTime.Today);
        var start = DateTime.Today.AddHours(8);
        var end = DateTime.Today.AddHours(16);

        var shift = new Shift(date, start, end, ShiftCategory.CLEANER);

        shift.Date.Should().Be(date);
        shift.StartTime.Should().Be(start);
        shift.EndTime.Should().Be(end);
        shift.Category.Should().Be(ShiftCategory.CLEANER);

        // ShiftId should be assigned by the constructor (non-negative)
        shift.ShiftId.Should().BeGreaterThanOrEqualTo(0);
    }

    [Fact]
    public void Properties_AreMutable_AfterConstruction()
    {
        var shift = new Shift(DateOnly.FromDateTime(DateTime.Today), DateTime.Now, DateTime.Now.AddHours(8), ShiftCategory.OTHER);

        var newDate = DateOnly.FromDateTime(DateTime.Today.AddDays(1));
        var newStart = DateTime.Today.AddHours(9);
        var newEnd = DateTime.Today.AddHours(17);

        shift.Date = newDate;
        shift.StartTime = newStart;
        shift.EndTime = newEnd;
        shift.Category = ShiftCategory.ADMIN;

        shift.Date.Should().Be(newDate);
        shift.StartTime.Should().Be(newStart);
        shift.EndTime.Should().Be(newEnd);
        shift.Category.Should().Be(ShiftCategory.ADMIN);
    }
}
