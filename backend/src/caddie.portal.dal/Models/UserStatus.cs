using System;
using System.Collections.Generic;

namespace caddie.portal.dal.Models;

public partial class UserStatus
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}
