using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace Transfers {
    public class PickupPointRepository : Repository<PickupPoint>, IPickupPointRepository {

        public PickupPointRepository(AppDbContext context) : base(context) { }

        public new async Task<IEnumerable<PickupPoint>> Get() {
            return await context.PickupPoints.Include(x => x.Route).ThenInclude(y => y.Port).AsNoTracking().ToListAsync();
        }

        public async Task<IEnumerable<PickupPoint>> GetForRoute(int routeId) {
            return await context.PickupPoints.Include(x => x.Route).ThenInclude(y => y.Port).Where(m => m.RouteId == routeId).OrderBy(o => o.Time).ThenBy(o => o.Description).AsNoTracking().ToListAsync();
        }

        public new async Task<PickupPoint> GetById(int pickupPointId) {
            return await context.PickupPoints.Include(x => x.Route).ThenInclude(y => y.Port).AsNoTracking().SingleOrDefaultAsync(m => m.Id == pickupPointId);
        }

    }

}