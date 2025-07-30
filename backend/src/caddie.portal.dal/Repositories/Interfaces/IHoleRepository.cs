using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

public interface IHoleRepository
{
    Task<Hole?> GetByIdAsync(int id);
    Task<Hole?> GetByCourseIdAndHoleNumberAsync(int courseId, int holeNumber);
    Task<Hole?> GetHoleByNumberAsync(int courseId, int holeNumber);
    Task<IEnumerable<Hole>> GetByCourseIdAsync(int courseId);
    Task<IEnumerable<Hole>> GetAllAsync();
    Task<Hole> CreateAsync(Hole hole);
    Task<Hole> UpdateAsync(Hole hole);
    Task<bool> DeleteAsync(int id);
    Task<bool> ExistsAsync(int courseId, int holeNumber);
    Task<IEnumerable<Hole>> GetByParAsync(int par);
    Task<int> GetTotalHolesForCourseAsync(int courseId);
}