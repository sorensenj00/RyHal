using System;
using Xunit;
using FluentAssertions;
using SportCenter.Api.Models;

namespace SportCenter.Api.UnitTests;

public class EmployeeTests
{
	[Fact]
	public void properties_AreMutable_AfterConstruction()
	{
		var employee = new Employee("John", "Doe");
		//TODO: når vi har implementeret EmployeeService, skal vi teste at vi kan tilføje og fjerne roller og kvalifikationer til en employee, samt at vi kan tilføje og fjerne shifts til en employee
	}
}