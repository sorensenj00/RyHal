using System;

public class Role
{
	public string Name { get; set; }

	public int RoleID { get; set; }

	public Role(string name, int id)
	{
		Name = name;
		RoleID = id;
	}

	override
	public string ToString()
	{
		return Name;
	}
}
