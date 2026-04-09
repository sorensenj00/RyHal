namespace SportCenter.Api.Models;
public class Employee {

    public string FirstName { get; set; }

    public string LastName { get; set; }

    public string? Phone { get; set; }
    
    public string? Email { get; set; }

    public int EmployeeId { get; set; }

    public List<Role>? Roles { get; set; }

    public List<Qualification>? Qualifications { get; set; }

    private static int _id = 0;

    public List<Shift> Shifts { get; set; } = new List<Shift>();

	public Employee(string firstName, string lastName)
    {
        FirstName = firstName;
        LastName = lastName;
        EmployeeId = _id++;
    }

    override
    public string ToString()
    {
        return FirstName + " " + LastName + "\nID: " + EmployeeId + "\n phone: " + Phone + "\n mail: " + Email;
    }

}