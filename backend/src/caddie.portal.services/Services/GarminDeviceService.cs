using Microsoft.Extensions.Logging;
using AutoMapper;
using caddie.portal.dal.Repositories.Interfaces;
using caddie.portal.dal.Models;
using caddie.portal.services.Interfaces;
using caddie.portal.services.Models;

namespace caddie.portal.services.Services;

/// <summary>
/// Service implementation for Garmin device business logic operations
/// </summary>
public class GarminDeviceService : IGarminDeviceService
{
    private readonly IGarminDeviceRepository _garminDeviceRepository;
    private readonly IUserRepository _userRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GarminDeviceService> _logger;

    public GarminDeviceService(
        IGarminDeviceRepository garminDeviceRepository,
        IUserRepository userRepository,
        IMapper mapper,
        ILogger<GarminDeviceService> logger)
    {
        _garminDeviceRepository = garminDeviceRepository;
        _userRepository = userRepository;
        _mapper = mapper;
        _logger = logger;
    }

    /// <summary>
    /// Get Garmin device by ID
    /// </summary>
    public async Task<GarminDeviceModel?> GetByIdAsync(int id)
    {
        try
        {
            var device = await _garminDeviceRepository.GetByIdAsync(id);
            return _mapper.Map<GarminDeviceModel>(device);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Garmin device {DeviceId}", id);
            throw;
        }
    }

    /// <summary>
    /// Get all Garmin devices for a user
    /// </summary>
    public async Task<IEnumerable<GarminDeviceModel>> GetByUserIdAsync(int userId)
    {
        try
        {
            var devices = await _garminDeviceRepository.GetByUserIdAsync(userId);
            return _mapper.Map<IEnumerable<GarminDeviceModel>>(devices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting Garmin devices for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Get user's preferred Garmin device
    /// </summary>
    public async Task<GarminDeviceModel?> GetPreferredDeviceAsync(int userId)
    {
        try
        {
            var device = await _garminDeviceRepository.GetPreferredDeviceAsync(userId);
            return _mapper.Map<GarminDeviceModel>(device);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting preferred Garmin device for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Get connected Garmin devices for a user
    /// </summary>
    public async Task<IEnumerable<GarminDeviceModel>> GetConnectedDevicesAsync(int userId)
    {
        try
        {
            var devices = await _garminDeviceRepository.GetConnectedDevicesAsync(userId);
            return _mapper.Map<IEnumerable<GarminDeviceModel>>(devices);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting connected Garmin devices for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Register a new Garmin device
    /// </summary>
    public async Task<DevicePairingResult> RegisterDeviceAsync(RegisterGarminDeviceModel model)
    {
        try
        {
            // Validate the registration data
            var validation = await ValidateDeviceRegistrationAsync(model);
            if (!validation.IsValid)
            {
                return new DevicePairingResult
                {
                    Success = false,
                    ErrorMessage = string.Join(", ", validation.ValidationErrors),
                    ErrorCode = validation.ErrorCode
                };
            }

            var device = _mapper.Map<GarminDevice>(model);
            var createdDevice = await _garminDeviceRepository.CreateAsync(device);

            _logger.LogInformation("Registered new Garmin device {DeviceId} ({DeviceName}) for user {UserId}", 
                createdDevice.Id, createdDevice.DeviceName, model.UserId);

            return new DevicePairingResult
            {
                Success = true,
                Device = _mapper.Map<GarminDeviceModel>(createdDevice)
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering Garmin device for user {UserId}", model.UserId);
            return new DevicePairingResult
            {
                Success = false,
                ErrorMessage = "An error occurred while registering the device",
                ErrorCode = "REGISTRATION_ERROR"
            };
        }
    }

    /// <summary>
    /// Update Garmin device information
    /// </summary>
    public async Task<GarminDeviceModel?> UpdateDeviceAsync(int id, UpdateGarminDeviceModel model, int userId)
    {
        try
        {
            // Verify user has access
            if (!await HasUserAccessAsync(id, userId))
            {
                _logger.LogWarning("User {UserId} attempted to update Garmin device {DeviceId} without access", userId, id);
                return null;
            }

            var existingDevice = await _garminDeviceRepository.GetByIdAsync(id);
            if (existingDevice == null)
            {
                return null;
            }

            // Apply updates
            _mapper.Map(model, existingDevice);
            
            var updatedDevice = await _garminDeviceRepository.UpdateAsync(existingDevice);

            _logger.LogInformation("Updated Garmin device {DeviceId} for user {UserId}", id, userId);

            return _mapper.Map<GarminDeviceModel>(updatedDevice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating Garmin device {DeviceId} for user {UserId}", id, userId);
            throw;
        }
    }

    /// <summary>
    /// Update device connection status
    /// </summary>
    public async Task<GarminDeviceModel?> UpdateConnectionStatusAsync(int id, UpdateConnectionStatusModel model, int userId)
    {
        try
        {
            // Verify user has access
            if (!await HasUserAccessAsync(id, userId))
            {
                _logger.LogWarning("User {UserId} attempted to update connection status for Garmin device {DeviceId} without access", userId, id);
                return null;
            }

            var updatedDevice = await _garminDeviceRepository.UpdateConnectionStatusAsync(
                id, model.ConnectionStatus, model.BatteryLevel, model.FirmwareVersion);

            if (updatedDevice != null)
            {
                _logger.LogInformation("Updated connection status for Garmin device {DeviceId} to {ConnectionStatus}", 
                    id, model.ConnectionStatus);
            }

            return _mapper.Map<GarminDeviceModel>(updatedDevice);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating connection status for Garmin device {DeviceId}", id);
            throw;
        }
    }

    /// <summary>
    /// Delete a Garmin device
    /// </summary>
    public async Task<bool> DeleteDeviceAsync(int id, int userId)
    {
        try
        {
            // Verify user has access
            if (!await HasUserAccessAsync(id, userId))
            {
                _logger.LogWarning("User {UserId} attempted to delete Garmin device {DeviceId} without access", userId, id);
                return false;
            }

            var deleted = await _garminDeviceRepository.DeleteAsync(id);
            
            if (deleted)
            {
                _logger.LogInformation("Deleted Garmin device {DeviceId} by user {UserId}", id, userId);
            }

            return deleted;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting Garmin device {DeviceId} by user {UserId}", id, userId);
            throw;
        }
    }

    /// <summary>
    /// Set a device as the preferred device for a user
    /// </summary>
    public async Task<bool> SetPreferredDeviceAsync(int deviceId, int userId)
    {
        try
        {
            // Verify user has access
            if (!await HasUserAccessAsync(deviceId, userId))
            {
                _logger.LogWarning("User {UserId} attempted to set preferred Garmin device {DeviceId} without access", userId, deviceId);
                return false;
            }

            var success = await _garminDeviceRepository.SetPreferredDeviceAsync(userId, deviceId);
            
            if (success)
            {
                _logger.LogInformation("Set Garmin device {DeviceId} as preferred for user {UserId}", deviceId, userId);
            }

            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting preferred Garmin device {DeviceId} for user {UserId}", deviceId, userId);
            throw;
        }
    }

    /// <summary>
    /// Get device connection summary for a user
    /// </summary>
    public async Task<DeviceConnectionSummaryModel> GetConnectionSummaryAsync(int userId)
    {
        try
        {
            var devices = await _garminDeviceRepository.GetByUserIdAsync(userId);
            var deviceModels = _mapper.Map<List<GarminDeviceModel>>(devices);

            var summary = new DeviceConnectionSummaryModel
            {
                UserId = userId,
                TotalDevices = deviceModels.Count,
                ConnectedDevices = deviceModels.Count(d => d.ConnectionStatus == "connected"),
                DisconnectedDevices = deviceModels.Count(d => d.ConnectionStatus == "disconnected"),
                PreferredDevice = deviceModels.FirstOrDefault(d => d.PreferredDevice == true),
                Devices = deviceModels
            };

            return summary;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting device connection summary for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Validate device registration data
    /// </summary>
    public async Task<DeviceValidationResult> ValidateDeviceRegistrationAsync(RegisterGarminDeviceModel model)
    {
        var result = new DeviceValidationResult { IsValid = true };

        try
        {
            // Check if user exists
            var user = await _userRepository.GetByIdAsync(model.UserId);
            if (user == null)
            {
                result.IsValid = false;
                result.ValidationErrors.Add("User not found");
                result.ErrorCode = "USER_NOT_FOUND";
                return result;
            }

            // Check if Bluetooth address is already registered for this user
            var existingDevice = await _garminDeviceRepository.GetByBluetoothAddressAsync(model.UserId, model.BluetoothAddress);
            if (existingDevice != null)
            {
                result.IsValid = false;
                result.ValidationErrors.Add("A device with this Bluetooth address is already registered");
                result.ErrorCode = "DEVICE_ALREADY_REGISTERED";
            }

            // Additional validation rules can be added here
            if (string.IsNullOrWhiteSpace(model.DeviceName))
            {
                result.IsValid = false;
                result.ValidationErrors.Add("Device name is required");
            }

            if (string.IsNullOrWhiteSpace(model.DeviceModel))
            {
                result.IsValid = false;
                result.ValidationErrors.Add("Device model is required");
            }

            if (string.IsNullOrWhiteSpace(model.BluetoothAddress))
            {
                result.IsValid = false;
                result.ValidationErrors.Add("Bluetooth address is required");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating device registration for user {UserId}", model.UserId);
            result.IsValid = false;
            result.ValidationErrors.Add("Validation error occurred");
            result.ErrorCode = "VALIDATION_ERROR";
        }

        if (!result.IsValid && string.IsNullOrEmpty(result.ErrorCode))
        {
            result.ErrorCode = "VALIDATION_FAILED";
        }

        return result;
    }

    /// <summary>
    /// Check if user has permission to access device
    /// </summary>
    public async Task<bool> HasUserAccessAsync(int deviceId, int userId)
    {
        try
        {
            var device = await _garminDeviceRepository.GetByIdAsync(deviceId);
            return device?.UserId == userId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error checking user access for device {DeviceId} and user {UserId}", deviceId, userId);
            return false;
        }
    }

    /// <summary>
    /// Get device health status
    /// </summary>
    public async Task<DeviceHealthStatus?> GetDeviceHealthAsync(int deviceId, int userId)
    {
        try
        {
            if (!await HasUserAccessAsync(deviceId, userId))
            {
                return null;
            }

            var device = await _garminDeviceRepository.GetByIdAsync(deviceId);
            if (device == null)
            {
                return null;
            }

            var healthStatus = new DeviceHealthStatus
            {
                DeviceId = device.Id,
                DeviceName = device.DeviceName,
                ConnectionStatus = device.ConnectionStatus ?? "unknown"
            };

            var healthIssues = new List<string>();

            // Check battery level
            if (device.BatteryLevel.HasValue)
            {
                healthStatus.BatteryLevel = device.BatteryLevel.Value;
                if (device.BatteryLevel < 20)
                {
                    healthIssues.Add("Low battery level");
                }
            }

            // Check connection status
            if (device.ConnectionStatus == "error")
            {
                healthIssues.Add("Connection error");
            }
            else if (device.ConnectionStatus == "disconnected")
            {
                healthIssues.Add("Device disconnected");
            }

            // Check last connection time
            if (device.LastConnectedAt.HasValue)
            {
                healthStatus.LastConnectedAt = device.LastConnectedAt;
                var daysSinceLastConnection = (DateTime.UtcNow - device.LastConnectedAt.Value).TotalDays;
                if (daysSinceLastConnection > 7)
                {
                    healthIssues.Add("Not connected for over a week");
                }
            }
            else
            {
                healthIssues.Add("Never connected");
            }

            healthStatus.IsHealthy = healthIssues.Count == 0;
            healthStatus.HealthIssues = healthIssues;

            return healthStatus;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting device health for device {DeviceId}", deviceId);
            throw;
        }
    }

    /// <summary>
    /// Test device connectivity (placeholder implementation)
    /// </summary>
    public async Task<(bool IsConnected, string StatusMessage)> TestConnectivityAsync(int deviceId, int userId)
    {
        try
        {
            if (!await HasUserAccessAsync(deviceId, userId))
            {
                return (false, "Access denied");
            }

            var device = await _garminDeviceRepository.GetByIdAsync(deviceId);
            if (device == null)
            {
                return (false, "Device not found");
            }

            // TODO: Implement actual Bluetooth connectivity test
            // For now, simulate based on current connection status
            var isConnected = device.ConnectionStatus == "connected";
            var message = isConnected ? "Device is connected and responsive" : "Device is not connected";

            return (isConnected, message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error testing connectivity for device {DeviceId}", deviceId);
            return (false, "Connectivity test failed");
        }
    }

    /// <summary>
    /// Sync device data and update connection status (placeholder implementation)
    /// </summary>
    public async Task<GarminDeviceModel?> SyncDeviceDataAsync(int deviceId, int userId)
    {
        try
        {
            if (!await HasUserAccessAsync(deviceId, userId))
            {
                return null;
            }

            // TODO: Implement actual device sync logic
            // For now, just update the last connected time if device is connected
            var device = await _garminDeviceRepository.GetByIdAsync(deviceId);
            if (device?.ConnectionStatus == "connected")
            {
                var updatedDevice = await _garminDeviceRepository.UpdateConnectionStatusAsync(
                    deviceId, "connected", device.BatteryLevel, device.FirmwareVersion);
                return _mapper.Map<GarminDeviceModel>(updatedDevice);
            }

            return _mapper.Map<GarminDeviceModel>(device);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error syncing device data for device {DeviceId}", deviceId);
            throw;
        }
    }

    /// <summary>
    /// Get devices that need firmware updates (placeholder implementation)
    /// </summary>
    public async Task<IEnumerable<GarminDeviceModel>> GetDevicesNeedingUpdatesAsync(int userId)
    {
        try
        {
            var devices = await _garminDeviceRepository.GetByUserIdAsync(userId);
            
            // TODO: Implement actual firmware version checking logic
            // For now, return empty collection
            var deviceModels = _mapper.Map<IEnumerable<GarminDeviceModel>>(devices);
            return deviceModels.Where(d => false); // Placeholder logic
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting devices needing updates for user {UserId}", userId);
            throw;
        }
    }

    /// <summary>
    /// Auto-discover nearby Garmin devices for a user (placeholder implementation)
    /// </summary>
    public async Task<IEnumerable<GarminDeviceModel>> DiscoverNearbyDevicesAsync(int userId)
    {
        try
        {
            // TODO: Implement actual Bluetooth discovery logic
            // This would typically involve platform-specific Bluetooth scanning
            await Task.CompletedTask; // Placeholder to satisfy async method
            return new List<GarminDeviceModel>();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error discovering nearby devices for user {UserId}", userId);
            throw;
        }
    }
}