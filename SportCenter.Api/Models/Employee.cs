namespace SportCenter.Api.Models;
public class Employee {

    public string FirstName { get; set; }

    public string LastName { get; set; }

    public string? Phone { get; set; }
    
    public string? Email { get; set; }

    public DateOnly? birthday { get; set; }

    public int EmployeeId { get; }

    public List<Role>? Roles { get; set; }

    public List<Qualification>? Qualifications { get; set; }

    public List<Shift> Shifts { get; set; } = new List<Shift>();

	public Employee(string firstName, string lastName int id)
    {
        FirstName = firstName;
        LastName = lastName;
        EmployeeId = id;
	}

    override
    public string ToString()
    {
        return FirstName + " " + LastName + "\nID: " + EmployeeId + "\n phone: " + Phone + "\n mail: " + Email;
    }

}