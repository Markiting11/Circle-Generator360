
import React, { useState, useCallback } from 'react';
import { generateCirclePoints } from './services/geoService';
import type { CoordinatePoint } from './types';
import { Input } from './components/Input';
import { Button } from './components/Button';
import { ResultsTable } from './components/ResultsTable';
import { PlusIcon } from './components/icons/PlusIcon';
import { TrashIcon } from './components/icons/TrashIcon';
import { DownloadIcon } from './components/icons/DownloadIcon';
import { GlobeIcon } from './components/icons/GlobeIcon';
import { CodeIcon } from './components/icons/CodeIcon';

const App: React.FC = () => {
  const [centerLat, setCenterLat] = useState<string>('40.7128');
  const [centerLon, setCenterLon] = useState<string>('-74.0060');
  const [distances, setDistances] = useState<string[]>(['1', '3', '5']);
  const [points, setPoints] = useState<CoordinatePoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleDistanceChange = (index: number, value: string) => {
    const newDistances = [...distances];
    newDistances[index] = value;
    setDistances(newDistances);
  };

  const addDistance = () => {
    if (distances.length < 5) {
      setDistances([...distances, '']);
    }
  };

  const removeDistance = (index: number) => {
    const newDistances = distances.filter((_, i) => i !== index);
    setDistances(newDistances);
  };

  const handleGenerate = useCallback(() => {
    setError(null);
    const lat = parseFloat(centerLat);
    const lon = parseFloat(centerLon);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      setError('Invalid Latitude. Must be between -90 and 90.');
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      setError('Invalid Longitude. Must be between -180 and 180.');
      return;
    }

    const validDistances = distances
      .map(parseFloat)
      .filter(d => !isNaN(d) && d > 0);

    if (validDistances.length === 0) {
      setError('Please provide at least one valid distance greater than 0.');
      return;
    }

    setIsLoading(true);
    setPoints([]);

    // Simulate async generation for better UX
    setTimeout(() => {
        try {
            const allPoints = validDistances.flatMap(distance => 
                generateCirclePoints(lat, lon, distance)
            );
            setPoints(allPoints);
        } catch(e: any) {
            setError(e.message || 'An unexpected error occurred during point generation.');
        } finally {
            setIsLoading(false);
        }
    }, 500);
  }, [centerLat, centerLon, distances]);
  
  const handleExport = useCallback(() => {
      if(points.length === 0) return;

      const headers = "Distance (miles),Angle (degrees),Latitude,Longitude";
      const csvContent = points.map(p => 
          `${p.distance},${p.angle},${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`
      ).join('\n');
      
      const fullCsv = `${headers}\n${csvContent}`;
      
      const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'geospatial_circles.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  }, [points]);

  const handleExportHtml = useCallback(() => {
    if (points.length === 0) return;

    const tableRows = points.map(p => `
        <tr>
            <td>${p.distance}</td>
            <td>${p.angle}</td>
            <td>${p.latitude.toFixed(6)}</td>
            <td>${p.longitude.toFixed(6)}</td>
        </tr>
    `).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Geospatial Circle Coordinates</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #111827; 
            color: #e5e7eb;
            margin: 0;
            padding: 2rem;
        }
        h1 {
            color: #22d3ee;
            text-align: center;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 2rem;
            box-shadow: 0 0 20px rgba(0,0,0,0.5);
            border-radius: 8px;
            overflow: hidden;
        }
        th, td { 
            padding: 12px 15px; 
            text-align: left; 
            border-bottom: 1px solid #374151;
        }
        thead {
            background-color: #1f2937;
        }
        th { 
            font-weight: 600;
            color: #67e8f9;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        tbody tr {
            transition: background-color 0.2s ease-in-out;
        }
        tbody tr:hover { 
            background-color: #374151; 
        }
        tbody tr:last-child td {
            border-bottom: none;
        }
        td:nth-child(3), td:nth-child(4) {
            font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace;
        }
    </style>
</head>
<body>
    <h1>Generated Geospatial Coordinates</h1>
    <table>
        <thead>
            <tr>
                <th>Distance (mi)</th>
                <th>Angle (°)</th>
                <th>Latitude</th>
                <th>Longitude</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'geospatial_circles.html');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [points]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 text-3xl sm:text-4xl font-bold text-cyan-400">
                <GlobeIcon />
                <h1>Geospatial Circle Generator</h1>
            </div>
            <p className="mt-2 text-lg text-gray-400">Create concentric circles of coordinates around a central point.</p>
        </header>

        <main className="bg-gray-800/50 backdrop-blur-sm shadow-2xl shadow-cyan-500/10 rounded-xl p-6 sm:p-8 border border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Center Point</h2>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Input label="Latitude" placeholder="e.g., 40.7128" value={centerLat} onChange={e => setCenterLat(e.target.value)} />
                  <Input label="Longitude" placeholder="e.g., -74.0060" value={centerLon} onChange={e => setCenterLon(e.target.value)} />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white mb-3">Distances (in miles)</h2>
                <div className="flex flex-col gap-3">
                  {distances.map((dist, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input 
                        placeholder={`e.g., ${index * 2 + 1}`} 
                        value={dist} 
                        onChange={e => handleDistanceChange(index, e.target.value)}
                        className="flex-grow"
                      />
                      <button 
                        onClick={() => removeDistance(index)} 
                        className="p-2 bg-red-600/20 hover:bg-red-500/40 rounded-md transition-colors duration-200 text-red-400 hover:text-red-300"
                        aria-label="Remove distance"
                        >
                        <TrashIcon />
                      </button>
                    </div>
                  ))}
                  {distances.length < 5 && (
                    <Button onClick={addDistance} variant="secondary">
                      <PlusIcon /> Add Distance
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Action & Status Section */}
            <div className="flex flex-col justify-between bg-gray-900/40 p-6 rounded-lg border border-gray-700">
                <div>
                    <h2 className="text-xl font-semibold text-white mb-4">Generate & Export</h2>
                     {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-md mb-4 text-sm">{error}</div>}
                    <div className="space-y-4">
                        <Button onClick={handleGenerate} disabled={isLoading} className="w-full">
                            {isLoading ? 'Generating Points...' : 'Generate Coordinates'}
                        </Button>
                        <Button onClick={handleExport} disabled={points.length === 0 || isLoading} variant="success" className="w-full">
                           <DownloadIcon /> Export to CSV
                        </Button>
                        <Button onClick={handleExportHtml} disabled={points.length === 0 || isLoading} variant="secondary" className="w-full">
                           <CodeIcon /> Export to HTML
                        </Button>
                    </div>
                </div>
                <div className="mt-6 text-center text-gray-400 text-sm">
                    {points.length > 0 && !isLoading && (
                        <p className="bg-green-500/10 text-green-300 p-2 rounded-md">
                           Successfully generated {points.length} points for {distances.filter(d => !isNaN(parseFloat(d)) && parseFloat(d)>0).length} circle(s).
                        </p>
                    )}
                    {isLoading && <p>Processing... please wait.</p>}
                </div>
            </div>
          </div>
          
          {points.length > 0 && !isLoading && (
            <div className="mt-8">
              <ResultsTable points={points} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
