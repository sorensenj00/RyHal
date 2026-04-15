using System;

public class Role
{
	public string Name { get; set; }

	public Role(string name)
	{
		Name = name;
	}

	override
	public string ToString()
	{
		return Name;
	}
}
