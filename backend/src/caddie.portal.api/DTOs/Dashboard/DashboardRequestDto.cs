using System.ComponentModel.DataAnnotations;

namespace caddie.portal.api.DTOs.Dashboard;

/// <summary>
/// Request DTO for refreshing dashboard insights
/// </summary>
public class RefreshInsightsRequestDto
{
    /// <summary>
    /// Force regeneration of insights even if recently updated
    /// </summary>
    public bool ForceRefresh { get; set; } = false;
}