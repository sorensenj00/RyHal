namespace SportCenter.Api.Models;
public class Location {
    private string name; 
    private int id; 
    
    public Location(string name, int id) {
        this.name = name;
        this.id = id;
    }

    public string Name {
        get { return name; }
        set { name = value; }
    }

    public int Id {
        get { return id; }
        set { id = value; }
    }

}