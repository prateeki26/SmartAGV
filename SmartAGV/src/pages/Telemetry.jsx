import { useState, useEffect } from 'react';
import { 
  Activity, 
  Wifi,
  Radio,
  Clock,
  BatteryCharging,
  Camera,
  VideoOff,
  Play,
  Square,
  Navigation,
  ShieldAlert,
  Gamepad2,
  CheckCircle2,
  ToggleLeft,
  ToggleRight,
  Download
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useSerial } from '../context/SerialContext';

// Mock data generator for battery health
const generateBatteryData = () => {
  const data = [];
  let time = new Date();
  time.setMinutes(time.getMinutes() - 30); // 30 mins ago
  
  let currentBattery = 95;
  
  for (let i = 0; i < 30; i++) {
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      health: currentBattery,
      voltage: (23.5 + Math.random() * 1.5).toFixed(2)
    });
    time.setMinutes(time.getMinutes() + 1);
    currentBattery = Math.max(78, currentBattery - (Math.random() * 0.8));
  }
  return data;
};

const missionLogs = [
  { id: 'TRP-1042', start: '09:15 AM', duration: '45m', distance: '1.2 km', status: 'Completed' },
  { id: 'TRP-1043', start: '10:30 AM', duration: '1h 12m', distance: '3.4 km', status: 'Completed' },
  { id: 'TRP-1044', start: '12:00 PM', duration: '30m', distance: '0.8 km', status: 'Completed' },
  { id: 'TRP-1045', start: '02:15 PM', duration: '22m', distance: '0.5 km', status: 'In Progress' },
];

export default function Telemetry() {
  const { videoUrl, wsCamConnected } = useSerial();
  const [batteryData, setBatteryData] = useState([]);
  const [autoCapture, setAutoCapture] = useState(false);
  const [eventDetected, setEventDetected] = useState(false);

  useEffect(() => {
    setBatteryData(generateBatteryData());
  }, []);

  // Simulated Suspicious Event Detection
  useEffect(() => {
    let interval;
    if (autoCapture) {
      interval = setInterval(() => {
        // 10% chance every 3 seconds to simulate an event
        if (Math.random() < 0.1) {
          triggerEvent();
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [autoCapture]);

  const triggerEvent = () => {
    setEventDetected(true);
    handleCapture();
    
    // Reset event overlay after a few seconds
    setTimeout(() => {
      setEventDetected(false);
    }, 4000);
  };

  const handleCapture = () => {
    // Hidden canvas to simulate drawing the current video frame
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    if (wsCamConnected && videoUrl) {
       const img = new Image();
       img.onload = () => {
         ctx.drawImage(img, 0, 0, 640, 480);
         
         ctx.fillStyle = '#ef4444';
         ctx.font = '20px monospace';
         ctx.fillText(`AGV Capture - ${new Date().toLocaleString()}`, 20, 40);
         if (eventDetected) {
            ctx.fillText('TRIGGER: SUSPICIOUS EVENT DETECTED', 20, 80);
         }

         const dataUrl = canvas.toDataURL('image/png');
         const link = document.createElement('a');
         link.href = dataUrl;
         link.download = `AGV_Capture_${Date.now()}.png`;
         link.click();
       };
       img.src = videoUrl;
    } else {
       // Just drawing a basic black frame with some text for simulation
       ctx.fillStyle = '#0a0a0a';
       ctx.fillRect(0, 0, 640, 480);
       ctx.fillStyle = '#ef4444';
       ctx.font = '20px monospace';
       ctx.fillText(`Signal Offline - ${new Date().toLocaleString()}`, 20, 40);

       const dataUrl = canvas.toDataURL('image/png');
       const link = document.createElement('a');
       link.href = dataUrl;
       link.download = `AGV_Capture_Offline_${Date.now()}.png`;
       link.click();
    }
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-[#0a0a0a] text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Telemetry Hub</h1>
              <p className="text-sm text-gray-400">Live sensor data and mission tracking</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="flex items-center space-x-2 bg-[#161616] px-4 py-2 rounded-lg border border-white/5">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-medium">98% Signal</span>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Charts, Commands & Logs (Span 2) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Live Telemetry Chart */}
            <div className="bg-[#161616] rounded-2xl p-6 border border-white/5">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-2">
                  <BatteryCharging className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold text-lg">Live Telemetry</h3>
                </div>
                <div className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs rounded-full border border-blue-500/20">
                  Battery vs Time
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={batteryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#6b7280" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={30}
                    />
                    <YAxis 
                      stroke="#6b7280" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      domain={['auto', 100]}
                      tickFormatter={(val) => `${val}%`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#60a5fa' }}
                      labelStyle={{ color: '#9ca3af', marginBottom: '8px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="health" 
                      name="Battery Health"
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: '#3b82f6', stroke: '#181b21', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Command Controls */}
            <div className="bg-[#161616] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Gamepad2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold text-lg">Command Controls</h3>
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
                <button className="flex flex-col items-center justify-center space-y-2 p-4 rounded-xl bg-cyan-500 text-black font-bold hover:bg-cyan-400 hover:scale-[1.02] shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all">
                  <Play className="w-6 h-6 fill-current" />
                  <span className="text-sm">Start</span>
                </button>
                <button className="flex flex-col items-center justify-center space-y-2 p-4 rounded-xl bg-red-500 text-black font-bold hover:bg-red-400 hover:scale-[1.02] shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">
                  <Square className="w-6 h-6 fill-current" />
                  <span className="text-sm">Stop</span>
                </button>
                <button className="flex flex-col items-center justify-center space-y-2 p-4 rounded-xl bg-[#1f1f1f] text-gray-400 font-semibold hover:bg-white/5 hover:text-white hover:border-white/20 border border-white/5 transition-all">
                  <Navigation className="w-6 h-6" />
                  <span className="text-sm">Patrol</span>
                </button>
                <button className="flex flex-col items-center justify-center space-y-2 p-4 rounded-xl bg-[#1f1f1f] text-gray-400 font-semibold hover:bg-white/5 hover:text-white hover:border-white/20 border border-white/5 transition-all">
                  <ShieldAlert className="w-6 h-6" />
                  <span className="text-sm">Avoidance</span>
                </button>
                <button className="flex flex-col items-center justify-center space-y-2 p-4 rounded-xl bg-[#1f1f1f] text-gray-400 font-semibold hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/30 border border-white/5 transition-all">
                  <Gamepad2 className="w-6 h-6" />
                  <span className="text-sm">Manual</span>
                </button>
              </div>
            </div>

            {/* Mission Logs */}
            <div className="bg-[#161616] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold text-lg">Mission Logs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0a0a0a] border-b border-white/5 text-xs uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4 font-medium">Trip ID</th>
                      <th className="px-6 py-4 font-medium">Start Time</th>
                      <th className="px-6 py-4 font-medium">Duration</th>
                      <th className="px-6 py-4 font-medium">Distance</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {missionLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-gray-300">{log.id}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{log.start}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{log.duration}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{log.distance}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            log.status === 'Completed' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {log.status === 'In Progress' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5 animate-pulse"></span>
                            )}
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Column: Video & Sensors (Span 1) */}
          <div className="space-y-8">
            
            {/* Live Video Section */}
            <div className="bg-[#161616] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center space-x-2">
                <Camera className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-lg">Live Video</h3>
              </div>
              <div className="p-4">
                <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 flex flex-col items-center justify-center">
                  <div className="absolute top-3 right-3 flex items-center space-x-2 bg-black/60 px-2 py-1 rounded-md backdrop-blur-sm z-10">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-[pulse_1.5s_ease-in-out_infinite]"></div>
                    <span className="text-xs font-mono text-red-500">LIVE</span>
                  </div>
                  {/* Event Detected Overlay */}
                  {wsCamConnected && videoUrl ? (
                    <img src={videoUrl} alt="Live Stream" className="absolute inset-0 w-full h-full object-contain" />
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
                      <VideoOff className="w-12 h-12 text-white/10 mb-3" />
                      <p className="text-red-500/80 font-mono text-sm tracking-widest uppercase mb-1">Signal Offline</p>
                      <p className="text-white/30 text-xs">Waiting for camera connection...</p>
                    </div>
                  )}

                  {/* Event Detected Overlay */}
                  {eventDetected && (
                    <div className="absolute inset-0 border-4 border-red-500 bg-red-500/10 flex items-center justify-center pointer-events-none animate-pulse z-20">
                      <div className="bg-red-500/90 text-white font-black uppercase tracking-widest px-6 py-2 rounded-lg text-lg shadow-[0_0_30px_rgba(239,68,68,0.8)] backdrop-blur-md">
                        Event Detected
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Camera Tools */}
            <div className="bg-[#161616] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-semibold text-lg">Camera Tools</h3>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <button 
                  onClick={handleCapture}
                  className="w-full flex justify-center items-center space-x-3 p-4 rounded-xl bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/30 hover:bg-cyan-500/20 hover:border-cyan-400 hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                >
                  <Download className="w-5 h-5" />
                  <span>Capture Frame</span>
                </button>
                
                <div className="flex items-center justify-between bg-[#0a0a0a] p-4 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Auto-Capture (Security)</span>
                    <span className="text-xs text-gray-500">Take photos on event triggers</span>
                  </div>
                  <button 
                    onClick={() => setAutoCapture(!autoCapture)}
                    className="p-1 rounded-lg hover:bg-white/5 transition-colors focus:outline-none"
                  >
                    {autoCapture ? (
                      <ToggleRight className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Obstacle Status */}
            <div className="bg-[#161616] rounded-2xl p-6 border border-emerald-500/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
              <div className="relative z-10 flex flex-col items-center justify-center text-center py-6">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 animate-[pulse_3s_ease-in-out_infinite]">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-400">Obstacle Status: Clear</h2>
                <p className="text-gray-400 text-sm mt-2">All pathway sensors nominal</p>
              </div>
            </div>

            {/* Sensor Data Grid */}
            <div className="bg-[#161616] rounded-2xl border border-white/5 overflow-hidden">
              <div className="p-5 border-b border-white/5 flex items-center space-x-2">
                <Radio className="w-5 h-5 text-indigo-400" />
                <h3 className="font-semibold text-lg">Distance Sensors</h3>
              </div>
              <div className="grid grid-cols-2 divide-x divide-y divide-white/5">
                {[
                  { pos: 'Front', ir: '142 cm', us: '145 cm' },
                  { pos: 'Rear', ir: '> 200 cm', us: '> 250 cm' },
                  { pos: 'Left', ir: '45 cm', us: '44 cm' },
                  { pos: 'Right', ir: '82 cm', us: '85 cm' },
                ].map((sensor) => (
                  <div key={sensor.pos} className="p-5 hover:bg-white/[0.02] transition-colors">
                    <p className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">{sensor.pos}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-[#0a0a0a] px-3 py-2 rounded-lg border border-white/5">
                        <span className="text-xs text-gray-500">IR Sensor</span>
                        <span className="text-sm font-mono text-indigo-300">{sensor.ir}</span>
                      </div>
                      <div className="flex justify-between items-center bg-[#0a0a0a] px-3 py-2 rounded-lg border border-white/5">
                        <span className="text-xs text-gray-500">Ultrasonic</span>
                        <span className="text-sm font-mono text-indigo-300">{sensor.us}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
