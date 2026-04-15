namespace SportCenter.Api.Models;
public class Location { 
    public string Name { get; set; }

    public int Id { get; set; }

    public Location(string name, int id) {
        Name = name;
        Id = id;
    }

   

}