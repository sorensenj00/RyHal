using System;

public class Qualification
{

	public string Name { get; set; }
	public string Description { get; set; }

    public int QualificationID { get; set; }

	public Qualification(string name, string description, int id)
    {
        Name = name;
        Description = description;
        QualificationID = id;
    }

    override
    public string ToString()
    {
        return Name + "\n" + Description;
    }
}
