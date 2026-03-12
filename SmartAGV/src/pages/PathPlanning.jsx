import { useState, useCallback, useRef } from 'react';
import { Settings, SendHorizontal, MapPin, Flag, ShieldAlert, Navigation, Upload, Trash2, Route } from 'lucide-react';

// Cell Types: 0 = Empty, 1 = Start (Cyan), 2 = Destination (Purple), 3 = Obstacle (Grey), 4 = Path (Yellow)
const CELL_EMPTY = 0;
const CELL_START = 1;
const CELL_DEST = 2;
const CELL_OBSTACLE = 3;
const CELL_PATH = 4;

// Active Modes: 'start', 'dest', 'obstacle'
const MODE_START = 'start';
const MODE_DEST = 'dest';
const MODE_OBSTACLE = 'obstacle';

export default function PathPlanning() {
  const [rows, setRows] = useState(12);
  const [cols, setCols] = useState(12);
  const [grid, setGrid] = useState(() => Array(12 * 12).fill(CELL_EMPTY));
  const [activeMode, setActiveMode] = useState(MODE_START);
  const [isSending, setIsSending] = useState(false);
  const [transmissionMode, setTransmissionMode] = useState('manual');
  const [pathFound, setPathFound] = useState(false);
  const fileInputRef = useRef(null);

  // Re-generate grid when rows/cols change
  const handleGridResize = (newRows, newCols) => {
    const r = Math.max(5, Math.min(newRows, 30)); // Clamping sizes
    const c = Math.max(5, Math.min(newCols, 30));
    setRows(r);
    setCols(c);
    setGrid(Array(r * c).fill(CELL_EMPTY));
    setPathFound(false);
  };

  const handleCellClick = useCallback((index) => {
    setPathFound(false);
    setGrid((prevGrid) => {
      // Clear any existing path when modifying grid
      const newGrid = prevGrid.map(cell => cell === CELL_PATH ? CELL_EMPTY : cell);
      const currentCell = newGrid[index];

      if (activeMode === MODE_START) {
        // Find existing start and remove it
        const prevStart = newGrid.indexOf(CELL_START);
        if (prevStart !== -1 && prevStart !== index) newGrid[prevStart] = CELL_EMPTY;
        
        // Toggle start on current, or clear if already start
        newGrid[index] = currentCell === CELL_START ? CELL_EMPTY : CELL_START;
      } 
      else if (activeMode === MODE_DEST) {
        // Find existing dest and remove it
        const prevDest = newGrid.indexOf(CELL_DEST);
        if (prevDest !== -1 && prevDest !== index) newGrid[prevDest] = CELL_EMPTY;
        
        // Toggle dest on current, or clear if already dest
        newGrid[index] = currentCell === CELL_DEST ? CELL_EMPTY : CELL_DEST;
      } 
      else if (activeMode === MODE_OBSTACLE) {
        // Prevent overwriting Start/Dest if we just want to avoid accidental clicks, 
        // but if we do, clear the Start/Dest state so the grid stays valid.
        // Toggling functionality:
        newGrid[index] = currentCell === CELL_OBSTACLE ? CELL_EMPTY : CELL_OBSTACLE;
      }

      return newGrid;
    });
  }, [activeMode]);

  const handleClearGrid = () => {
    setGrid(Array(rows * cols).fill(CELL_EMPTY));
    setPathFound(false);
  };

  const handleMapUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = cols;
        canvas.height = rows;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, cols, rows);
        const imageData = ctx.getImageData(0, 0, cols, rows);
        const data = imageData.data;

        const newGrid = Array(rows * cols).fill(CELL_EMPTY);
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          if (brightness < 128) {
            const pixelIndex = i / 4;
            newGrid[pixelIndex] = CELL_OBSTACLE;
          }
        }
        
        setGrid(newGrid);
        setPathFound(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    event.target.value = null; // allow re-uploading the same file
  };

  const findPath = (start, dest, currentGrid) => {
    const getX = (idx) => idx % cols;
    const getY = (idx) => Math.floor(idx / cols);
    const manhattanDist = (i1, i2) => Math.abs(getX(i1) - getX(i2)) + Math.abs(getY(i1) - getY(i2));

    const openSet = new Set([start]);
    const cameFrom = new Map();

    const gScore = new Map();
    gScore.set(start, 0);

    const fScore = new Map();
    fScore.set(start, manhattanDist(start, dest));

    while (openSet.size > 0) {
      let current = null;
      let minFScore = Infinity;

      for (const node of openSet) {
        const score = fScore.get(node) ?? Infinity;
        if (score < minFScore) {
          minFScore = score;
          current = node;
        }
      }

      if (current === dest) {
        const path = [];
        let curr = current;
        while (cameFrom.has(curr)) {
          curr = cameFrom.get(curr);
          if (curr !== start && curr !== dest) path.unshift(curr);
        }
        return path;
      }

      openSet.delete(current);

      const cx = getX(current);
      const cy = getY(current);

      const neighbors = [];
      if (cy > 0) neighbors.push(current - cols);
      if (cy < rows - 1) neighbors.push(current + cols);
      if (cx > 0) neighbors.push(current - 1);
      if (cx < cols - 1) neighbors.push(current + 1);

      for (const neighbor of neighbors) {
        if (currentGrid[neighbor] === CELL_OBSTACLE) continue;

        const tentative_gScore = (gScore.get(current) ?? Infinity) + 1;

        if (tentative_gScore < (gScore.get(neighbor) ?? Infinity)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentative_gScore);
          fScore.set(neighbor, tentative_gScore + manhattanDist(neighbor, dest));
          if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
          }
        }
      }
    }
    return null;
  };

  const transmitToAgv = () => {
    setIsSending(true);
    // Simulate sending time
    setTimeout(() => {
      setIsSending(false);
    }, 1500);
  };

  const handleFindPath = () => {
    const startIdx = grid.indexOf(CELL_START);
    const destIdx = grid.indexOf(CELL_DEST);
    
    if (startIdx === -1 || destIdx === -1) return;

    const path = findPath(startIdx, destIdx, grid);
    
    if (path === null) {
      alert('No valid path found!');
      setPathFound(false);
      return;
    }

    setGrid(prev => {
      const newGrid = prev.map(cell => cell === CELL_PATH ? CELL_EMPTY : cell);
      path.forEach(idx => {
        if (newGrid[idx] !== CELL_START && newGrid[idx] !== CELL_DEST) {
          newGrid[idx] = CELL_PATH;
        }
      });
      return newGrid;
    });

    setPathFound(true);

    if (transmissionMode === 'auto') {
      transmitToAgv();
    }
  };

  return (
    <div className="h-full w-full overflow-hidden bg-[#0a0a0a] text-white flex flex-col lg:flex-row font-sans selection:bg-cyan-500/30">
      
      {/* Left Area: Grid Display */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-auto min-h-[500px] border-b lg:border-b-0 lg:border-r border-white/5 relative">
        <div className="absolute top-8 left-8 flex items-center space-x-3 text-white/50">
          <Navigation className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold tracking-tight text-white">Path Planning</h1>
        </div>

        {/* Dynamic Grid */}
        <div 
          className="bg-[#121212] p-4 sm:p-6 rounded-2xl border border-white/10 shadow-2xl transition-all w-full max-w-4xl max-h-full aspect-square md:aspect-auto flex items-center justify-center"
        >
          <div 
            className="grid gap-1 sm:gap-1.5 auto-rows-fr w-full h-full"
            style={{ 
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`
            }}
          >
            {grid.map((cell, idx) => {
              let cellStyle = "bg-[#1f1f1f] border border-white/5 hover:border-white/20";
              
              if (cell === CELL_START) cellStyle = "bg-cyan-500 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)]";
              else if (cell === CELL_DEST) cellStyle = "bg-purple-500 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]";
              else if (cell === CELL_OBSTACLE) cellStyle = "bg-[#333333] border-[#444444] shadow-inner";
              else if (cell === CELL_PATH) cellStyle = "bg-yellow-400 border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.5)]";

              return (
                <button
                  key={idx}
                  onClick={() => handleCellClick(idx)}
                  className={`rounded-sm sm:rounded-md transition-all duration-200 aspect-square flex items-center justify-center ${cellStyle}`}
                  aria-label={`Cell ${idx}`}
                >
                  {cell === CELL_START && <MapPin className="w-4 h-4 text-white sm:w-5 sm:h-5 opacity-80" />}
                  {cell === CELL_DEST && <Flag className="w-4 h-4 text-white sm:w-5 sm:h-5 opacity-80" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 flex flex-wrap gap-6 items-center justify-center text-sm font-medium text-gray-400 bg-[#161616] px-6 py-3 rounded-full border border-white/5">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-sm bg-cyan-500 border border-cyan-400"></div>
            <span>Start Point</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-sm bg-purple-500 border border-purple-400"></div>
            <span>Destination</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-sm bg-[#333333] border border-[#444444]"></div>
            <span>Obstacle</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-sm bg-yellow-400 border border-yellow-300"></div>
            <span>Path</span>
          </div>
        </div>
      </div>

      {/* Right Area: Control Panel */}
      <div className="w-full lg:w-96 bg-[#161616] flex flex-col p-6 lg:p-8 shrink-0 relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-10">
        
        <div className="flex items-center mb-8 border-b border-white/5 pb-6">
          <Settings className="w-5 h-5 text-gray-400 mr-3" />
          <h2 className="text-lg font-semibold tracking-wide uppercase text-gray-200">Grid Configuration</h2>
        </div>

        {/* Controls Form */}
        <div className="space-y-8 flex-1">
          
          {/* Grid Size Inputs */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Map Dimensions</label>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#1f1f1f] rounded-xl border border-white/5 p-3 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Rows (Y)</span>
                <input 
                  type="number" 
                  min="5" 
                  max="30"
                  value={rows}
                  onChange={(e) => handleGridResize(parseInt(e.target.value) || 5, cols)}
                  className="bg-transparent outline-none text-xl font-mono text-white"
                />
              </div>
              <div className="bg-[#1f1f1f] rounded-xl border border-white/5 p-3 flex flex-col">
                <span className="text-xs text-gray-500 mb-1">Cols (X)</span>
                <input 
                  type="number"
                  min="5" 
                  max="30"
                  value={cols}
                  onChange={(e) => handleGridResize(rows, parseInt(e.target.value) || 5)}
                  className="bg-transparent outline-none text-xl font-mono text-white"
                />
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">Adjusting dimensions will clear current nodes.</p>
          </div>

          {/* Map Controls */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Map Management</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center p-3 rounded-xl bg-[#1f1f1f] border border-white/5 text-gray-400 hover:bg-white/5 hover:text-white transition-all shadow-sm"
              >
                <Upload className="w-4 h-4 mr-2" />
                <span className="text-sm font-semibold">Upload Map</span>
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleMapUpload}
                className="hidden"
              />
              <button
                onClick={handleClearGrid}
                className="flex items-center justify-center p-3 rounded-xl bg-[#1f1f1f] border border-white/5 text-gray-400 hover:bg-white/5 hover:text-red-400 transition-all shadow-sm"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                <span className="text-sm font-semibold">Clear Grid</span>
              </button>
            </div>
          </div>

          {/* Action Modes */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Draw Tools</label>
            <div className="space-y-3">
              <button
                onClick={() => setActiveMode(MODE_START)}
                className={`w-full flex items-center p-4 rounded-xl border transition-all ${
                  activeMode === MODE_START 
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' 
                    : 'bg-[#1f1f1f] border-white/5 text-gray-400 hover:bg-white/5'
                }`}
              >
                <MapPin className="w-5 h-5 mr-3" />
                <span className="font-semibold">{activeMode === MODE_START ? 'Drawing Start' : 'Set Start Node'}</span>
              </button>
              
              <button
                onClick={() => setActiveMode(MODE_DEST)}
                className={`w-full flex items-center p-4 rounded-xl border transition-all ${
                  activeMode === MODE_DEST 
                    ? 'bg-purple-500/10 border-purple-500 text-purple-400' 
                    : 'bg-[#1f1f1f] border-white/5 text-gray-400 hover:bg-white/5'
                }`}
              >
                <Flag className="w-5 h-5 mr-3" />
                <span className="font-semibold">{activeMode === MODE_DEST ? 'Drawing Dest' : 'Set Destination'}</span>
              </button>

              <button
                onClick={() => setActiveMode(MODE_OBSTACLE)}
                className={`w-full flex items-center p-4 rounded-xl border transition-all ${
                  activeMode === MODE_OBSTACLE 
                    ? 'bg-[#333333] border-gray-500 text-white' 
                    : 'bg-[#1f1f1f] border-white/5 text-gray-400 hover:bg-white/5'
                }`}
              >
                <ShieldAlert className="w-5 h-5 mr-3" />
                <span className="font-semibold">{activeMode === MODE_OBSTACLE ? 'Drawing Obstacles' : 'Plot Obstacles'}</span>
              </button>
            </div>
          </div>

          {/* Transmission Mode */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <label className="text-sm font-medium text-gray-400 uppercase tracking-wider">Transmission Mode</label>
            <div className="flex bg-[#1f1f1f] p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setTransmissionMode('manual')}
                className={`flex-1 flex items-center justify-center py-2 text-sm font-semibold rounded-lg transition-all ${
                  transmissionMode === 'manual' 
                    ? 'bg-[#333333] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Manual
              </button>
              <button
                onClick={() => setTransmissionMode('auto')}
                className={`flex-1 flex items-center justify-center py-2 text-sm font-semibold rounded-lg transition-all ${
                  transmissionMode === 'auto' 
                    ? 'bg-indigo-500 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                Auto
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-8 mt-auto border-t border-white/5 space-y-3">
          <button
            onClick={handleFindPath}
            disabled={grid.indexOf(CELL_START) === -1 || grid.indexOf(CELL_DEST) === -1}
            className={`w-full flex items-center justify-center space-x-3 p-4 rounded-xl font-bold transition-all duration-300 ${
              grid.indexOf(CELL_START) !== -1 && grid.indexOf(CELL_DEST) !== -1
                ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:scale-[1.02] shadow-[0_0_15px_rgba(250,204,21,0.3)]'
                : 'bg-[#1f1f1f] text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>Find Path</span>
            <Route className="w-5 h-5" />
          </button>

          <button
            onClick={transmitToAgv}
            disabled={isSending || !pathFound}
            className={`w-full flex items-center justify-center space-x-3 p-4 rounded-xl font-bold transition-all duration-300 ${
              isSending 
                ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' 
                : pathFound
                  ? 'bg-black text-cyan-400 border border-cyan-500 hover:bg-cyan-500/10 hover:scale-[1.02] shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-[#1f1f1f] text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {isSending ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                <span>Transmitting...</span>
              </>
            ) : (
              <>
                <span>Transmit to AGV</span>
                <SendHorizontal className="w-5 h-5" />
              </>
            )}
          </button>
          
          {(grid.indexOf(CELL_START) === -1 || grid.indexOf(CELL_DEST) === -1) && (
            <p className="text-center text-xs text-red-400/70 mt-2 flex items-center justify-center space-x-1">
              <ShieldAlert className="w-3 h-3" />
              <span>Requires both Start and Destination.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
