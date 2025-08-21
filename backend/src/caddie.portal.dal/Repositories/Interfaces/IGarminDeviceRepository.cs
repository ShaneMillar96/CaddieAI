using caddie.portal.dal.Models;

namespace caddie.portal.dal.Repositories.Interfaces;

/// <summary>
/// Repository interface for Garmin device operations
/// </summary>
public interface IGarminDeviceRepository
{
    /// <summary>
    /// Get Garmin device by ID
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>Garmin device or null if not found</returns>
    Task<GarminDevice?> GetByIdAsync(int id);

    /// <summary>
    /// Get all Garmin devices for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Collection of user's Garmin devices</returns>
    Task<IEnumerable<GarminDevice>> GetByUserIdAsync(int userId);

    /// <summary>
    /// Get Garmin device by Bluetooth address for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="bluetoothAddress">Bluetooth MAC address</param>
    /// <returns>Garmin device or null if not found</returns>
    Task<GarminDevice?> GetByBluetoothAddressAsync(int userId, string bluetoothAddress);

    /// <summary>
    /// Get user's preferred Garmin device
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Preferred Garmin device or null if none set</returns>
    Task<GarminDevice?> GetPreferredDeviceAsync(int userId);

    /// <summary>
    /// Get connected Garmin devices for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <returns>Collection of connected Garmin devices</returns>
    Task<IEnumerable<GarminDevice>> GetConnectedDevicesAsync(int userId);

    /// <summary>
    /// Get devices by connection status for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="connectionStatus">Connection status</param>
    /// <returns>Collection of devices with the specified status</returns>
    Task<IEnumerable<GarminDevice>> GetByConnectionStatusAsync(int userId, string connectionStatus);

    /// <summary>
    /// Create a new Garmin device
    /// </summary>
    /// <param name="garminDevice">Garmin device to create</param>
    /// <returns>Created Garmin device</returns>
    Task<GarminDevice> CreateAsync(GarminDevice garminDevice);

    /// <summary>
    /// Update an existing Garmin device
    /// </summary>
    /// <param name="garminDevice">Garmin device to update</param>
    /// <returns>Updated Garmin device</returns>
    Task<GarminDevice> UpdateAsync(GarminDevice garminDevice);

    /// <summary>
    /// Delete a Garmin device
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>True if deleted, false if not found</returns>
    Task<bool> DeleteAsync(int id);

    /// <summary>
    /// Check if a Garmin device exists
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <returns>True if exists, false otherwise</returns>
    Task<bool> ExistsAsync(int id);

    /// <summary>
    /// Check if a Bluetooth address is already registered for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="bluetoothAddress">Bluetooth MAC address</param>
    /// <param name="excludeDeviceId">Optional device ID to exclude from check (for updates)</param>
    /// <returns>True if address is already registered, false otherwise</returns>
    Task<bool> IsBluetoothAddressRegisteredAsync(int userId, string bluetoothAddress, int? excludeDeviceId = null);

    /// <summary>
    /// Update connection status for a device
    /// </summary>
    /// <param name="id">Device ID</param>
    /// <param name="connectionStatus">New connection status</param>
    /// <param name="batteryLevel">Optional battery level</param>
    /// <param name="firmwareVersion">Optional firmware version</param>
    /// <returns>Updated device</returns>
    Task<GarminDevice?> UpdateConnectionStatusAsync(int id, string connectionStatus, int? batteryLevel = null, string? firmwareVersion = null);

    /// <summary>
    /// Set a device as the preferred device for a user
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="deviceId">Device ID to set as preferred</param>
    /// <returns>True if successful, false otherwise</returns>
    Task<bool> SetPreferredDeviceAsync(int userId, int deviceId);
}