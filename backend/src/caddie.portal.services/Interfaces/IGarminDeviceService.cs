using caddie.portal.services.Models;

namespace caddie.portal.services.Interfaces;

/// <summary>
/// Service interface for Garmin device business logic operations
/// </summary>
public interface IGarminDeviceService
{
    /// <summary>
    /// Get Garmin device by ID
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>Garmin device or null if not found</returns>
    Task<GarminDeviceModel?> GetByIdAsync(int id);

    /// <summary>
    /// Get all Garmin devices for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Collection of user's Garmin devices</returns>
    Task<IEnumerable<GarminDeviceModel>> GetByUserIdAsync(int userId);

    /// <summary>
    /// Get user's preferred Garmin device
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Preferred Garmin device or null if none set</returns>
    Task<GarminDeviceModel?> GetPreferredDeviceAsync(int userId);

    /// <summary>
    /// Get connected Garmin devices for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Collection of connected Garmin devices</returns>
    Task<IEnumerable<GarminDeviceModel>> GetConnectedDevicesAsync(int userId);

    /// <summary>
    /// Register a new Garmin device
    /// </summary>
    /// <param name="model">Device registration model</param>
    /// <returns>Device pairing result</returns>
    Task<DevicePairingResult> RegisterDeviceAsync(RegisterGarminDeviceModel model);

    /// <summary>
    /// Update Garmin device information
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <param name="model">Device update model</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Updated device or null if not found/unauthorized</returns>
    Task<GarminDeviceModel?> UpdateDeviceAsync(int id, UpdateGarminDeviceModel model, int userId);

    /// <summary>
    /// Update device connection status
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <param name="model">Connection status update model</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Updated device or null if not found/unauthorized</returns>
    Task<GarminDeviceModel?> UpdateConnectionStatusAsync(int id, UpdateConnectionStatusModel model, int userId);

    /// <summary>
    /// Delete a Garmin device
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>True if deleted, false if not found or unauthorized</returns>
    Task<bool> DeleteDeviceAsync(int id, int userId);

    /// <summary>
    /// Set a device as the preferred device for a user
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="userId">User ID</param>
    /// <returns>True if successful, false otherwise</returns>
    Task<bool> SetPreferredDeviceAsync(int deviceId, int userId);

    /// <summary>
    /// Get device connection summary for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Device connection summary</returns>
    Task<DeviceConnectionSummaryModel> GetConnectionSummaryAsync(int userId);

    /// <summary>
    /// Validate device registration data
    /// </summary>
    /// <param name="model">Device registration model</param>
    /// <returns>Validation result</returns>
    Task<DeviceValidationResult> ValidateDeviceRegistrationAsync(RegisterGarminDeviceModel model);

    /// <summary>
    /// Check if user has permission to access device
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="userId">User ID</param>
    /// <returns>True if user has access, false otherwise</returns>
    Task<bool> HasUserAccessAsync(int deviceId, int userId);

    /// <summary>
    /// Get device health status
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Device health status</returns>
    Task<DeviceHealthStatus?> GetDeviceHealthAsync(int deviceId, int userId);

    /// <summary>
    /// Test device connectivity
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Connectivity test result</returns>
    Task<(bool IsConnected, string StatusMessage)> TestConnectivityAsync(int deviceId, int userId);

    /// <summary>
    /// Sync device data and update connection status
    /// </summary>
    /// <param name="deviceId">Device ID</param>
    /// <param name="userId">User ID for authorization</param>
    /// <returns>Sync result with updated device information</returns>
    Task<GarminDeviceModel?> SyncDeviceDataAsync(int deviceId, int userId);

    /// <summary>
    /// Get devices that need firmware updates
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Collection of devices needing updates</returns>
    Task<IEnumerable<GarminDeviceModel>> GetDevicesNeedingUpdatesAsync(int userId);

    /// <summary>
    /// Auto-discover nearby Garmin devices for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Collection of discoverable devices</returns>
    Task<IEnumerable<GarminDeviceModel>> DiscoverNearbyDevicesAsync(int userId);
}