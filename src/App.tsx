import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, AlertCircle, Trash2, Edit2, Pipette, X } from 'lucide-react';
import { Wheel } from '@uiw/react-color';
import { templates } from './templates';

interface Pixel {
  x: number;
  y: number;
  color: string;
}

interface Template {
  name: string;
  pixels: Pixel[];
}

const DEFAULT_COLORS = [
  '#ffffff', // White
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#000000', // Black
  '#ff8800', // Orange
  '#8800ff', // Purple
];

function App() {
  const [pixels, setPixels] = useState<Pixel[]>([]);
  const [error, setError] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>(DEFAULT_COLORS[0]);
  const [draggedColor, setDraggedColor] = useState<string | null>(null);
  const [colors, setColors] = useState<string[]>(DEFAULT_COLORS);
  const [editingColorIndex, setEditingColorIndex] = useState<number | null>(null);
  const [isPickingColor, setIsPickingColor] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [artworkName, setArtworkName] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const rows = 30;
  const cols = 10;

  useEffect(() => {
    if (showNameDialog && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNameDialog]);

  const handleTemplateSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedTemplate = templates.find(t => t.name === event.target.value);
    if (selectedTemplate) {
      setSelectedTemplate(event.target.value);
      setPixels(selectedTemplate.pixels);
    }
  };

  const handlePixelClick = (x: number, y: number) => {
    if (isPickingColor) {
      const pixel = pixels.find(p => p.x === x && p.y === y);
      if (pixel && editingColorIndex !== null) {
        const newColors = [...colors];
        newColors[editingColorIndex] = pixel.color;
        setColors(newColors);
        setSelectedColor(pixel.color);
        setIsPickingColor(false);
      }
      return;
    }

    setPixels(prev => {
      const existing = prev.findIndex(p => p.x === x && p.y === y);
      if (existing !== -1) {
        const newPixels = [...prev];
        newPixels[existing] = { x, y, color: selectedColor };
        return newPixels;
      }
      return [...prev, { x, y, color: selectedColor }];
    });
  };

  const clearPixel = (x: number, y: number) => {
    setPixels(prev => prev.filter(p => !(p.x === x && p.y === y)));
  };

  const handlePixelContextMenu = (e: React.MouseEvent, x: number, y: number) => {
    e.preventDefault();
    clearPixel(x, y);
  };

  const getPixelColor = (x: number, y: number) => {
    return pixels.find(p => p.x === x && p.y === y)?.color;
  };

  const handleDownload = () => {
    setShowNameDialog(true);
    setArtworkName('');
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = artworkName.trim() || 'pixel-art';
    const dataStr = JSON.stringify({ name, pixels }, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowNameDialog(false);
  };

  const validatePixelData = (data: any): data is Template => {
    if (typeof data !== 'object') return false;
    if (!Array.isArray(data.pixels)) return false;
    return data.pixels.every(pixel => 
      typeof pixel === 'object' &&
      typeof pixel.x === 'number' &&
      typeof pixel.y === 'number' &&
      typeof pixel.color === 'string' &&
      pixel.x >= 0 &&
      pixel.x < cols &&
      pixel.y >= 0 &&
      pixel.y < rows
    );
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        if (validatePixelData(content)) {
          setPixels(content.pixels);
          if (content.name) {
            setArtworkName(content.name);
          }
        } else {
          setError('Invalid JSON format');
        }
      } catch (err) {
        setError('Invalid JSON format');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragStart = (e: React.DragEvent, color: string) => {
    e.dataTransfer.setData('text/plain', color);
    setDraggedColor(color);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault();
    const color = e.dataTransfer.getData('text/plain');
    setPixels(prev => {
      const existing = prev.findIndex(p => p.x === x && p.y === y);
      if (existing !== -1) {
        const newPixels = [...prev];
        newPixels[existing] = { x, y, color };
        return newPixels;
      }
      return [...prev, { x, y, color }];
    });
    setDraggedColor(null);
  };

  const handleClearAll = () => {
    setPixels([]);
  };

  const handleColorChange = (color: { hex: string }) => {
    if (editingColorIndex !== null) {
      const newColors = [...colors];
      newColors[editingColorIndex] = color.hex;
      setColors(newColors);
      setSelectedColor(color.hex);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="bg-zinc-900 p-8 rounded-lg shadow-2xl">
        {/* Title Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">PixPal Editor</h1>
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImport}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded transition-colors"
              title="Upload"
            >
              <Upload size={20} />
            </button>
            <button
              onClick={handleDownload}
              className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded transition-colors"
              title="Download"
            >
              <Download size={20} />
            </button>
          </div>
        </div>

        {/* Template Selection */}
        <div className="mb-6 flex items-center gap-4">
          <select
            value={selectedTemplate}
            onChange={handleTemplateSelect}
            className="flex-grow bg-zinc-800 text-white border-none rounded p-2 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Template</option>
            {templates.map((template, index) => (
              <option key={index} value={template.name}>
                {template.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded transition-colors text-sm"
            title="Clear all pixels"
          >
            <Trash2 size={12} />
            <span>reset</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-500 bg-red-500/10 p-2 rounded">
            <AlertCircle size={16} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Editor Container */}
        <div className="flex justify-center gap-6">
          {/* Color Palette */}
          <div className="flex flex-col gap-2">
            {colors.map((color, index) => (
              <div key={index} className="relative group">
                <button
                  draggable
                  onDragStart={(e) => handleDragStart(e, color)}
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-12 h-12 
                    rounded-full 
                    cursor-pointer 
                    transition-transform 
                    hover:scale-110 
                    focus:outline-none 
                    focus:ring-2 
                    focus:ring-blue-500
                    ${color === selectedColor ? 'ring-2 ring-white scale-110' : ''}
                  `}
                  style={{ backgroundColor: color }}
                  title={color}
                />
                <button
                  onClick={() => setEditingColorIndex(index)}
                  className="absolute -right-2 -top-2 bg-zinc-800 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit color"
                >
                  <Edit2 size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>

          {/* Pixel Editor Container */}
          <div className="flex flex-col gap-4 relative">
            {/* Color Picker */}
            {editingColorIndex !== null && (
              <div className="absolute -top-4 -right-64 bg-zinc-800 p-4 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-white text-sm">Edit Color</span>
                  <button
                    onClick={() => setIsPickingColor(!isPickingColor)}
                    className={`
                      p-2 rounded-full
                      transition-colors
                      ${isPickingColor 
                        ? 'bg-blue-500 hover:bg-blue-600' 
                        : 'bg-zinc-700 hover:bg-zinc-600'
                      }
                    `}
                    title={isPickingColor ? 'Cancel color picking' : 'Pick color from canvas'}
                  >
                    <Pipette size={16} className="text-white" />
                  </button>
                </div>
                <Wheel
                  color={colors[editingColorIndex]}
                  onChange={handleColorChange}
                />
                <button
                  onClick={() => {
                    setEditingColorIndex(null);
                    setIsPickingColor(false);
                  }}
                  className="mt-4 w-full bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Done
                </button>
              </div>
            )}

            {/* Pixel Editor Grid */}
            <div 
              ref={editorRef}
              className={`
                grid gap-[1px] bg-zinc-800 p-[1px] rounded
                ${isPickingColor ? 'cursor-crosshair' : ''}
              `}
              style={{ 
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                width: 'fit-content'
              }}
            >
              {Array.from({ length: rows }, (_, y) =>
                Array.from({ length: cols }, (_, x) => {
                  const color = getPixelColor(x, y);
                  return (
                    <div
                      key={`${x}-${y}`}
                      data-x={x}
                      data-y={y}
                      onClick={() => handlePixelClick(x, y)}
                      onContextMenu={(e) => handlePixelContextMenu(e, x, y)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, x, y)}
                      className={`
                        group
                        w-8 h-8 
                        cursor-pointer 
                        transition-all 
                        duration-200 
                        hover:opacity-80
                        relative
                        ${!color ? 'bg-zinc-700' : ''}
                        ${isPickingColor && color ? 'hover:ring-2 hover:ring-blue-500' : ''}
                      `}
                      style={color ? { backgroundColor: color } : {}}
                      title={isPickingColor ? 'Click to pick this color' : 'Left click to set color, right click to clear'}
                    >
                      {!color && (
                        <>
                          <div className="absolute inset-0 bg-zinc-800/50" />
                          <div 
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 4px,
                                rgba(0, 0, 0, 0.1) 4px,
                                rgba(0, 0, 0, 0.1) 8px
                              )`
                            }}
                          />
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Name Input Dialog */}
        {showNameDialog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-zinc-900 p-6 rounded-lg shadow-xl w-96">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white">Save Artwork</h2>
                <button
                  onClick={() => setShowNameDialog(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleNameSubmit}>
                <div className="mb-4">
                  <label htmlFor="artworkName" className="block text-sm font-medium text-zinc-400 mb-2">
                    Artwork Name
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    id="artworkName"
                    value={artworkName}
                    onChange={(e) => setArtworkName(e.target.value)}
                    placeholder="Enter a name for your artwork"
                    className="w-full bg-zinc-800 text-white border-none rounded p-2 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNameDialog(false)}
                    className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
