const { execSync, spawn } = require('child_process');

class ADBHelper {
  /**
   * Check if Android device/emulator is connected
   */
  static isDeviceConnected() {
    try {
      const devices = execSync('adb devices', { encoding: 'utf8' });
      return devices.includes('device') || devices.includes('emulator');
    } catch (error) {
      console.error('ADB not available:', error);
      return false;
    }
  }

  /**
   * Clear logcat buffer
   */
  static clearLogcat() {
    try {
      execSync('adb logcat -c');
      console.log('🧹 Logcat buffer cleared');
    } catch (error) {
      console.error('Failed to clear logcat:', error);
    }
  }

  /**
   * Capture console logs for specified duration
   * @param {number} duration - Duration in milliseconds
   * @param {string[]} filters - Log filters (e.g., ['ReactNativeJS', 'CaddieAI'])
   */
  static async captureConsoleLogs(duration = 10000, filters = ['ReactNativeJS', 'CaddieAI', 'System.err']) {
    return new Promise((resolve, reject) => {
      const filterPattern = filters.join('|');
      const logProcess = spawn('adb', ['logcat', '-v', 'time']);
      const logs = [];
      let timeoutId;

      logProcess.stdout.on('data', (data) => {
        const logLine = data.toString();
        if (new RegExp(filterPattern).test(logLine)) {
          logs.push({
            timestamp: new Date().toISOString(),
            content: logLine.trim()
          });
        }
      });

      logProcess.stderr.on('data', (data) => {
        console.error('ADB logcat error:', data.toString());
      });

      timeoutId = setTimeout(() => {
        logProcess.kill();
        resolve(logs);
      }, duration);

      logProcess.on('close', (code) => {
        clearTimeout(timeoutId);
        if (code === 0) {
          resolve(logs);
        } else {
          reject(new Error(`ADB logcat exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Get device system information
   */
  static getDeviceInfo() {
    try {
      const model = execSync('adb shell getprop ro.product.model', { encoding: 'utf8' }).trim();
      const version = execSync('adb shell getprop ro.build.version.release', { encoding: 'utf8' }).trim();
      const api = execSync('adb shell getprop ro.build.version.sdk', { encoding: 'utf8' }).trim();
      
      return {
        model,
        androidVersion: version,
        apiLevel: api
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return null;
    }
  }

  /**
   * Force stop the CaddieAI app
   */
  static forceStopApp() {
    try {
      execSync('adb shell am force-stop com.caddieaimobile');
      console.log('🛑 CaddieAI app force stopped');
    } catch (error) {
      console.error('Failed to force stop app:', error);
    }
  }

  /**
   * Launch the CaddieAI app
   */
  static launchApp() {
    try {
      execSync('adb shell monkey -p com.caddieaimobile -c android.intent.category.LAUNCHER 1');
      console.log('🚀 CaddieAI app launched');
    } catch (error) {
      console.error('Failed to launch app:', error);
    }
  }

  /**
   * Capture screenshot using ADB
   * @param {string} filename - Screenshot filename
   */
  static async captureScreenshot(filename = 'screenshot.png') {
    try {
      execSync(`adb shell screencap /sdcard/${filename}`);
      execSync(`adb pull /sdcard/${filename} ./e2e/screenshots/${filename}`);
      execSync(`adb shell rm /sdcard/${filename}`);
      console.log(`📸 Screenshot saved: ./e2e/screenshots/${filename}`);
      return `./e2e/screenshots/${filename}`;
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return null;
    }
  }

  /**
   * Monitor memory usage of the app
   */
  static getMemoryUsage() {
    try {
      const memInfo = execSync('adb shell dumpsys meminfo com.caddieaimobile', { encoding: 'utf8' });
      // Parse memory info - simplified version
      const lines = memInfo.split('\n');
      const totalPssLine = lines.find(line => line.includes('TOTAL'));
      if (totalPssLine) {
        const match = totalPssLine.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
      }
      return null;
    } catch (error) {
      console.error('Failed to get memory usage:', error);
      return null;
    }
  }

  /**
   * Input text using ADB
   * @param {string} text - Text to input
   */
  static inputText(text) {
    try {
      const escapedText = text.replace(/'/g, "\\'").replace(/"/g, '\\"');
      execSync(`adb shell input text "${escapedText}"`);
      console.log(`⌨️ Input text: ${text}`);
    } catch (error) {
      console.error('Failed to input text:', error);
    }
  }

  /**
   * Tap at coordinates
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  static tap(x, y) {
    try {
      execSync(`adb shell input tap ${x} ${y}`);
      console.log(`👆 Tapped at (${x}, ${y})`);
    } catch (error) {
      console.error(`Failed to tap at (${x}, ${y}):`, error);
    }
  }
}

module.exports = ADBHelper;