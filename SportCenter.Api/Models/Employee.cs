namespace SportCenter.Api.Models;
public class Employee {

    public string FirstName { get; set; }

    public string LastName { get; set; }

    public string Phone { get; set; }
    
    public string Email { get; set; }

    public int Id { get; set; }

    public List<Role> Roles { get; set; }

    public List<Qualification> Qualifications { get; set; }

    private static int _id = 0;

    public Employee(string firstName, string lastName)
    {
        FirstName = firstName;
        LastName = lastName;
        Id = _id++;
    }

    override
    public string ToString()
    {
        return FirstName + " " + LastName + "\nID: " + Id + "\n phone: " + Phone + "\n mail: " + Email;
    }

}