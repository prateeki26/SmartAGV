import { useState } from 'react';
import { 
  Battery,
  Gauge,
  Navigation,
  Crosshair,
  Bluetooth,
  Wifi,
  ToggleLeft,
  ToggleRight,
  AlertTriangle
} from 'lucide-react';
import { parseHardwareStream } from '../services/agvDataProcessor';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';

const pieData = [
  { name: 'Sensors', value: 35, color: '#3b82f6' }, // Blue
  { name: 'Motion', value: 25, color: '#10b981' },  // Emerald
  { name: 'Power', value: 20, color: '#8b5cf6' },  // Violet
  { name: 'Drive', value: 15, color: '#f59e0b' },  // Amber
  { name: 'System', value: 5, color: '#ef4444' },   // Red
];

export default function Dashboard() {
  const [btConnected, setBtConnected] = useState(false);
  const [wifiConnected, setWifiConnected] = useState(false);
  const [btDevice, setBtDevice] = useState(null);
  const [btCharacteristic, setBtCharacteristic] = useState(null);
  const [connectionError, setConnectionError] = useState(null);

  // Common UUIDs for HC-05 / Serial Modules (e.g., JDY-31, HM-10)
  // 0xFFE0 is the standard Serial Service UUID, 0xFFE1 is the Characteristic
  const SERIAL_SERVICE_UUID = 0xFFE0;
  const SERIAL_CHARACTERISTIC_UUID = 0xFFE1;

  // Real-time sensor states to store incoming HC-05 Stream Data
  const [liveSensors, setLiveSensors] = useState({
    battery: '--',
    usDistance: '--',
  });

  const topMetrics = [
    { id: 'battery', label: 'Battery', value: btConnected ? `${liveSensors.battery}V` : '--', icon: Battery, color: btConnected ? 'text-emerald-400' : 'text-gray-600', bg: btConnected ? 'bg-emerald-400/10' : 'bg-gray-800' },
    { id: 'speed', label: 'Speed', value: btConnected ? '2.4 m/s' : '--', icon: Gauge, color: btConnected ? 'text-blue-400' : 'text-gray-600', bg: btConnected ? 'bg-blue-400/10' : 'bg-gray-800' },
    { id: 'mode', label: 'Mode', value: 'Line', icon: Navigation, color: 'text-violet-400', bg: 'bg-violet-400/10' },
    { label: 'Position', value: '(5.2, 4.8)', icon: Crosshair, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  ];

  const processedMetrics = [
    {
      title: 'Sensors',
      color: 'border-blue-500/30',
      stats: [
        'Min obstacle: 22 cm',
        'Line deviation: 0.05m',
        'Lidar status: OK',
        'Camera FPS: 30'
      ]
    },
    {
      title: 'Motion',
      color: 'border-emerald-500/30',
      stats: [
        'Current Vel: 2.4 m/s',
        'Target Vel: 2.5 m/s',
        'Accel: 0.5 m/s²',
        'Yaw Rate: 0.1 rad/s'
      ]
    },
    {
      title: 'Power',
      color: 'border-violet-500/30',
      stats: [
        'Voltage: 24.2V',
        'Current draw: 4.5A',
        'Motor L Temp: 42°C',
        'Motor R Temp: 41°C'
      ]
    },
    {
      title: 'Drive',
      color: 'border-amber-500/30',
      stats: [
        'Torque L: 12 Nm',
        'Torque R: 11.5 Nm',
        'Encoder L: 45021',
        'Encoder R: 45018'
      ]
    },
    {
      title: 'System',
      color: 'border-red-500/30',
      stats: [
        `US Distance: ${btConnected ? liveSensors.usDistance + ' cm' : 'Offline'}`,
        'Memory: 2.1GB/8GB',
        'Network: 45ms',
        'Uptime: 4h 12m'
      ]
    }
  ];

  const connectBluetooth = async () => {
    setConnectionError(null);
    try {
      console.log('Requesting Bluetooth Device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERIAL_SERVICE_UUID] }],
        optionalServices: [SERIAL_SERVICE_UUID] // Depending on HC-05 exact implementation
      });

      console.log('Connecting to GATT Server...');
      const server = await device.gatt.connect();

      console.log('Getting Serial Service...');
      const service = await server.getPrimaryService(SERIAL_SERVICE_UUID);

      console.log('Getting Serial Characteristic...');
      const characteristic = await service.getCharacteristic(SERIAL_CHARACTERISTIC_UUID);

      setBtDevice(device);
      setBtCharacteristic(characteristic);

      // Start receiving stream alerts
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', handleCharacteristicValueChanged);

      // Listen for spontaneous disconnection
      device.addEventListener('gattserverdisconnected', onDisconnected);

      setBtConnected(true);
      console.log('Bluetooth Connected Successfully!');

    } catch (error) {
      console.error('Bluetooth Connection Failed:', error);
      if (error.name === 'NotFoundError' || error.message.includes('User cancelled')) {
        setConnectionError('Connection Cancelled by User.');
      } else {
        setConnectionError('Device not found or connection rejected.');
      }
      setBtConnected(false);
      
      // Auto-clear error after 3 seconds
      setTimeout(() => setConnectionError(null), 3000);
    }
  };

  const handleCharacteristicValueChanged = (event) => {
    const valueDataView = event.target.value;
    
    // Parse the data utilizing our agvDataProcessor service
    // Pass a mock onAutoCapture function for now
    const parsedData = parseHardwareStream(valueDataView, () => console.log('Auto-Capture Triggered from Dashboard!'));
    
    if (parsedData) {
      setLiveSensors({
        battery: parsedData.batteryVoltage !== null ? parsedData.batteryVoltage : liveSensors.battery,
        usDistance: parsedData.ultrasonic !== null ? parsedData.ultrasonic : liveSensors.usDistance
      });
    }
  };

  const disconnectBluetooth = () => {
    if (btDevice && btDevice.gatt.connected) {
      btDevice.gatt.disconnect();
    }
    setBtConnected(false);
    setLiveSensors({ battery: '--', usDistance: '--' });
    console.log('Bluetooth Disconnected Manually.');
  };

  const onDisconnected = () => {
    console.log('Bluetooth Disconnected Spontaneously.');
    setBtConnected(false);
    setLiveSensors({ battery: '--', usDistance: '--' });
  };

  const toggleBluetooth = () => {
    if (btConnected) {
      disconnectBluetooth();
    } else {
      connectBluetooth();
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full w-full overflow-hidden bg-[#0f1115]">
      {/* Header */}
      <header className="h-20 bg-[#181b21]/50 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-8 sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard Overview</h1>
            <p className="text-sm text-gray-400 mt-1">Real-time telemetry and system status</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1.5 rounded-full border text-sm font-medium flex items-center space-x-2 ${
              btConnected || wifiConnected 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${btConnected || wifiConnected ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span>{btConnected || wifiConnected ? 'System Online' : 'System Offline'}</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-[#0f1115] shadow-lg"></div>
          </div>
        </header>

        {/* Scrollable Dashboard Area */}
        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topMetrics.map((metric, idx) => {
                const Icon = metric.icon;
                return (
                  <div key={idx} className="bg-[#181b21] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors group">
                    <div className="flex items-center space-x-4">
                      <div className={`p-4 rounded-xl ${metric.bg} transition-transform group-hover:scale-110 duration-300`}>
                        <Icon size={24} className={metric.color} />
                      </div>
                      <div className={metric.id === 'battery' || metric.id === 'speed' ? (!btConnected ? 'opacity-50' : '') : ''}>
                        <p className="text-sm font-medium text-gray-400 mb-1">{metric.label}</p>
                        <p className={`text-2xl font-bold tracking-tight ${metric.id === 'battery' || metric.id === 'speed' ? (!btConnected ? 'text-gray-600' : 'text-white') : 'text-white'}`}>{metric.value}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pie Chart Card - Takes up 2 columns on large screens */}
              <div className="lg:col-span-2 bg-[#181b21] rounded-2xl p-6 border border-white/5 flex flex-col">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">Data Distribution</h2>
                  <p className="text-sm text-gray-400">System resources allocation across modules</p>
                </div>
                <div className="flex-1 min-h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#181b21', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* System Connectivity Card */}
              <div className="bg-[#181b21] rounded-2xl p-6 border border-white/5 flex flex-col">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold">System Connectivity</h2>
                  <p className="text-sm text-gray-400">Communication links status</p>
                </div>
                <div className="flex-1 space-y-6 flex flex-col justify-center">
                  
                  {/* Bluetooth Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[#0f1115] rounded-xl border border-white/5">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2.5 rounded-lg ${btConnected ? 'bg-blue-500/10 text-blue-400' : 'bg-gray-800 text-gray-500'}`}>
                        <Bluetooth size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Bluetooth (HC-05)</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${btConnected ? 'bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-red-500'}`}></span>
                          <span className="text-xs text-gray-500">{btConnected ? 'Connected (Telemetry & Cmd)' : 'Disconnected'}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={toggleBluetooth}
                      className="p-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none relative"
                    >
                      {btConnected ? (
                        <ToggleRight className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-500" />
                      )}
                      
                      {/* Interactive Hover Prompt (if not connected and no error) */}
                      {!btConnected && !connectionError && (
                         <div className="absolute -top-8 -right-4 bg-indigo-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity pointer-events-none">
                            Click to Pair
                         </div>
                      )}
                    </button>
                  </div>
                  
                  {/* Connection Error Banner */}
                  {connectionError && (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flexItems-center space-x-2 text-red-400 text-xs animate-in fade-in slide-in-from-top-2">
                       <AlertTriangle className="w-4 h-4 shrink-0" />
                       <span>{connectionError}</span>
                    </div>
                  )}

                  {/* WiFi Toggle */}
                  <div className="flex items-center justify-between p-4 bg-[#0f1115] rounded-xl border border-white/5">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2.5 rounded-lg ${wifiConnected ? 'bg-indigo-500/10 text-indigo-400' : 'bg-gray-800 text-gray-500'}`}>
                        <Wifi size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">Wi-Fi (ESP32-CAM)</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${wifiConnected ? 'bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-red-500'}`}></span>
                          <span className="text-xs text-gray-500">{wifiConnected ? 'Connected (Video Stream)' : 'Disconnected'}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => setWifiConnected(!wifiConnected)}
                      className="p-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
                    >
                      {wifiConnected ? (
                        <ToggleRight className="w-8 h-8 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-gray-500" />
                      )}
                    </button>
                  </div>

                </div>
              </div>

              {/* Quick Status / Log Panel */}
              <div className="bg-[#181b21] rounded-2xl p-6 border border-white/5 flex flex-col">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold">System Logs</h2>
                    <p className="text-sm text-gray-400">Recent events</p>
                  </div>
                  <button className="text-indigo-400 text-sm hover:text-indigo-300 transition-colors">View All</button>
                </div>
                <div className="flex-1 space-y-4">
                  {[
                    { time: '10:42:01', msg: 'Path re-calculated due to obstacle.', type: 'warn' },
                    { time: '10:41:15', msg: 'Arrived at Station C.', type: 'info' },
                    { time: '10:35:00', msg: 'Battery optimization enabled.', type: 'info' },
                    { time: '10:30:22', msg: 'Departure from Base Station.', type: 'success' },
                  ].map((log, i) => (
                    <div key={i} className="flex items-start space-x-3 text-sm">
                      <span className="text-gray-500 font-mono text-xs mt-0.5 w-16 shrink-0">{log.time}</span>
                      <div className="flex items-start space-x-2">
                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                          log.type === 'warn' ? 'bg-amber-400' : 
                          log.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'
                        }`} />
                        <span className="text-gray-300">{log.msg}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Processed Metrics Grid */}
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold">Processed Metrics</h2>
                <p className="text-sm text-gray-400 mt-1">Detailed subsystem readouts</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {processedMetrics.map((module, idx) => (
                  <div key={idx} className={`bg-[#181b21] rounded-xl p-5 border-t-2 ${module.color} border-x border-b border-white/5 hover:bg-[#1c1f26] transition-colors`}>
                    <h3 className="text-md font-semibold mb-4 text-white">{module.title}</h3>
                    <ul className="space-y-3">
                      {module.stats.map((stat, sIdx) => (
                        <li key={sIdx} className="text-sm text-gray-400 flex items-start space-x-2">
                          <span className="w-1 h-1 rounded-full bg-gray-500 mt-2 shrink-0"></span>
                          <span>{stat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
    </main>
  );
}
