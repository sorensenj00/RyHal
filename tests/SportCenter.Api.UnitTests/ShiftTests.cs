using System;
using Xunit;
using FluentAssertions;
using SportCenter.Api.Models;
using SportCenter.Api.Services;

namespace SportCenter.Api.UnitTests;

public class ShiftTests
{
    [Fact]
    public void Constructor_SetsProperties()
    {
        var start = DateTime.Today.AddHours(8);
        var end = DateTime.Today.AddHours(16);

        var shift = ShiftService.CreateShift(start, end, ShiftCategory.CLEANER, 1);

        shift.StartTime.Should().Be(start);
        shift.EndTime.Should().Be(end);
        shift.Category.Should().Be(ShiftCategory.CLEANER);
        shift.ShiftId.Should().Be(1);
    }

    [Fact]
    public void Properties_AreMutable_AfterConstruction()
    {
        var shift = ShiftService.CreateShift(DateTime.Now, DateTime.Now.AddHours(8), ShiftCategory.OTHER, 1);

        var newStart = DateTime.Today.AddHours(9);
        var newEnd = DateTime.Today.AddHours(17);

        shift.StartTime = newStart;
        shift.EndTime = newEnd;
        shift.Category = ShiftCategory.ADMIN;

        shift.StartTime.Should().Be(newStart);
        shift.EndTime.Should().Be(newEnd);
        shift.Category.Should().Be(ShiftCategory.ADMIN);
		//TODO: når vi har implementeret shiftservice, skal der testes at dennes metoder korrekt opdaterer shift-objekter
	}
}
