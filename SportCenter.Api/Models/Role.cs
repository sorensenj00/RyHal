using System;

public class Role
{
	public string Name { get; set; }
	public string Description { get; set; }

	public Role(string name, string description)
	{
		Name = name;
		Description = description;
	}
}
