using System;

public class Qualification
{

	public string Name { get; set; }
	public string Description { get; set; }

	public Qualification(string name, string description)
    {
        Name = name;
        Description = description;
    }
}
