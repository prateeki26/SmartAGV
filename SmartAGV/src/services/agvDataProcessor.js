/**
 * AGV Data Processor Service
 * Handles data translation between the Web UI and the HC-05 / ESP32-CAM Hardware
 */

/**
 * Parses a CSV string from the HC-05 Arduino stream into structured JSON.
 * Example input: "U150,IL40,IR80,B12.4"
 * 
 * U -> Ultrasonic Distance (cm)
 * IL -> IR Sensor Left (cm)
 * IR -> IR Sensor Right (cm)
 * B -> Battery Voltage (V)
 * 
 * @param {string} dataString - The CSV string from the Arduino.
 * @param {function} onAutoCapture - Callback to trigger the ESP32-CAM capture frame.
 * @returns {object|null} - Parsed sensor data object or null if invalid.
 */
export const parseHardwareStream = (dataInput, onAutoCapture) => {
  if (!dataInput) return null;

  let dataString = '';
  // Convert DataView from Bluetooth to string if necessary
  if (dataInput instanceof DataView) {
    const decoder = new TextDecoder('utf-8');
    dataString = decoder.decode(dataInput);
  } else if (typeof dataInput === 'string') {
    dataString = dataInput;
  } else {
    return null;
  }

  const parsedData = {
    ultrasonic: null,
    irLeft: null,
    irRight: null,
    batteryVoltage: null,
  };

  const chunks = dataString.split(',');

  chunks.forEach((chunk) => {
    const trimmedChunk = chunk.trim();
    if (!trimmedChunk) return;

    if (trimmedChunk.startsWith('U')) {
      parsedData.ultrasonic = parseFloat(trimmedChunk.substring(1));
      
      // Auto- Capture Security Trigger:
      // If the parsed Ultrasonic value is < 20cm, automatically trigger the camera
      if (parsedData.ultrasonic < 20 && typeof onAutoCapture === 'function') {
        onAutoCapture();
      }
    } 
    else if (trimmedChunk.startsWith('IL')) {
      parsedData.irLeft = parseFloat(trimmedChunk.substring(2));
    }
    else if (trimmedChunk.startsWith('IR')) {
      parsedData.irRight = parseFloat(trimmedChunk.substring(2));
    }
    else if (trimmedChunk.startsWith('B')) {
      parsedData.batteryVoltage = parseFloat(trimmedChunk.substring(1));
    }
  });

  return parsedData;
};

/**
 * Converts a UI button action into short character codes for the HC-05 Bluetooth link.
 * Automatically writes the code if a valid Bluetooth characteristic is provided.
 * 
 * @param {string} action - The UI action (e.g., 'start', 'stop', 'manual', 'forward', 'left').
 * @param {BluetoothRemoteGATTCharacteristic} [txCharacteristic] - The characteristic to write to.
 * @returns {Promise<string|null>} - The character code transmitted, or null if unknown/failed.
 */
export const sendCommand = async (action, txCharacteristic) => {
  if (!action || typeof action !== 'string') return null;

  const commandMap = {
    // Standard Modes
    'start': 'G',      // Go / Start Autonomous Mode
    'stop': 'S',       // Stop / Halt all motors
    'manual': 'M',     // Enter Manual override Mode
    'patrol': 'P',     // Enter Patrol Mode
    'avoidance': 'A',  // Enter Dedicated Obstacle Avoidance mode
    
    // Manual Navigation Vectors (if in Manual mode)
    'forward': 'F',
    'backward': 'B',
    'left': 'L',
    'right': 'R',
  };

  const code = commandMap[action.toLowerCase()];
  
  if (code) {
    console.log(`[Bluetooth TX] Intending to send command Code: '${code}' for action: '${action}'`);
    
    // Write the character directly to the Bluetooth module if passed
    if (txCharacteristic) {
      try {
        const encoder = new TextEncoder();
        await txCharacteristic.writeValue(encoder.encode(code));
        console.log(`[Bluetooth TX] Successfully sent '${code}' to AGV.`);
      } catch (error) {
        console.error(`[Bluetooth TX] Error writing to characteristic:`, error);
        return null;
      }
    }
    
    return code;
  }
  
  console.warn(`[Bluetooth TX] Unknown action requested: '${action}'`);
  return null;
};
