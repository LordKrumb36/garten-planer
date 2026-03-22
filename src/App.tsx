import { useState, useEffect } from 'react';
import { Sprout, Calendar, Info, Leaf, Search, ThumbsUp, ThumbsDown, Plus, X, RefreshCw, Edit, Trash2, Camera, Image as ImageIcon, Cloud } from 'lucide-react';
import { seedData as staticSeedData, months, SeedData } from './data';
import staticBedsData from './beds_data.json';
import './App.css';

interface Row {
  seedName: string;
}

interface Bed {
  id: string;
  name: string;
  rows: Row[];
  images?: string[];
}

const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 11);
};

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeed, setSelectedSeed] = useState<SeedData | null>(null);
  const [selectedBedForGallery, setSelectedBedForGallery] = useState<Bed | null>(null);
  const [availableAssets, setAvailableAssets] = useState<string[]>([]);
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleImageError = (url: string) => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  };
  const [seedToEdit, setSeedToEdit] = useState<SeedData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [customSeeds, setCustomSeeds] = useState<SeedData[]>([]);
  const [beds, setBeds] = useState<Bed[]>(() => {
    try {
      // Priority 1: Check if we have bundled beds data (from git/cloud)
      if (staticBedsData && Array.isArray(staticBedsData) && staticBedsData.length > 0) {
        return staticBedsData;
      }

      const savedBeds = localStorage.getItem('garden-beds-v2');
      if (savedBeds) return JSON.parse(savedBeds);
      
      // Migration from v1 (string[][])
      const v1Beds = localStorage.getItem('garden-beds');
      if (v1Beds) {
        const parsed = JSON.parse(v1Beds);
        if (Array.isArray(parsed)) {
          return parsed.map((seeds: string[], i: number) => ({
            id: generateId(),
            name: `Beet ${i + 1}`,
            rows: Array.isArray(seeds) ? seeds.map(s => ({ seedName: s })) : []
          }));
        }
      }

      return [{ id: generateId(), name: 'Hauptbeet', rows: [] }];
    } catch (e) {
      console.error("Failed to load beds:", e);
      return [{ id: generateId(), name: 'Hauptbeet', rows: [] }];
    }
  });
  
  // Combined seeds list
  const allSeeds = [...staticSeedData, ...customSeeds];

  const filteredSeeds = allSeeds.filter(seed => 
    seed.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentMonth = 'Mär'; // Static for prototype
  
  const activeThisMonth = allSeeds.filter(seed => 
    seed.calendar[currentMonth]
  );
  
  useEffect(() => {
    localStorage.setItem('garden-beds-v2', JSON.stringify(beds));
  }, [beds]);

  const handleSaveBedsToCloud = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/save-beds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beds }),
      });
      if (response.ok) {
        alert("Planung lokal gesichert! Bitte Gemini jetzt sagen: 'Beete zu GitHub pushen', damit es online erscheint.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddBed = () => {
    setBeds([...beds, { id: generateId(), name: `Beet ${beds.length + 1}`, rows: [] }]);
  };

  const handleRemoveBed = (id: string) => {
    setBeds(beds.filter(b => b.id !== id));
  };

  const handleUpdateBedName = (id: string, name: string) => {
    setBeds(beds.map(b => b.id === id ? { ...b, name } : b));
  };

  const handleAddRow = (bedId: string, seedName: string) => {
    if (seedName === "ADD_NEW") {
      setIsAddModalOpen(true);
      return;
    }
    setBeds(beds.map(b => b.id === bedId ? { ...b, rows: [...b.rows, { seedName }] } : b));
  };

  const handleRemoveRow = (bedId: string, rowIndex: number) => {
    setBeds(beds.map(b => b.id === bedId ? { ...b, rows: b.rows.filter((_, i) => i !== rowIndex) } : b));
  };

  const handleAddImageToBed = (bedId: string) => {
    const url = window.prompt("Bitte Bild-URL eingeben (z.B. von einem Cloud-Speicher):");
    if (url) {
      setBeds(beds.map(b => b.id === bedId ? { ...b, images: [...(b.images || []), url] } : b));
      // If the gallery is open, update the selected bed to reflect the new image
      if (selectedBedForGallery?.id === bedId) {
        const bed = beds.find(b => b.id === bedId);
        if (bed) setSelectedBedForGallery({ ...bed, images: [...(bed.images || []), url] });
      }
    }
  };

  const handleRemoveImageFromBed = (bedId: string, imageUrl: string) => {
    if (!window.confirm("Bild wirklich löschen?")) return;
    setBeds(beds.map(b => b.id === bedId ? { ...b, images: (b.images || []).filter(img => img !== imageUrl) } : b));
    if (selectedBedForGallery?.id === bedId) {
      setSelectedBedForGallery(prev => prev ? { ...prev, images: (prev.images || []).filter(img => img !== imageUrl) } : null);
    }
  };

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/list-images');
      if (response.ok) {
        const files = await response.json();
        setAvailableAssets(files);
        setIsAssetSelectorOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch assets:", err);
    }
  };

  const handleAssetSelect = (filename: string) => {
    if (!selectedBedForGallery) return;
    const url = `/images/${filename}`;
    const bedId = selectedBedForGallery.id;
    
    setBeds(beds.map(b => b.id === bedId ? { ...b, images: [...(b.images || []), url] } : b));
    setSelectedBedForGallery(prev => prev ? { ...prev, images: [...(prev.images || []), url] } : null);
    setIsAssetSelectorOpen(false);
  };

  const getCompanionInfo = (seedName: string, bedRows: Row[]) => {
    const seed = allSeeds.find(s => s.name === seedName);
    if (!seed) return { status: 'neutral', reason: '' };

    const otherSeedsInBed = bedRows
      .map(r => r.seedName)
      .filter(name => name !== seedName);

    for (const otherName of otherSeedsInBed) {
      const otherSeed = allSeeds.find(s => s.name === otherName);
      
      const isBadSelf = seed.badNeighbors?.some(bad => otherName.toLowerCase().includes(bad.toLowerCase()));
      const isBadOther = otherSeed?.badNeighbors?.some(bad => seedName.toLowerCase().includes(bad.toLowerCase()));
      
      if (isBadSelf || isBadOther) {
        return { status: 'bad', reason: `Schlechte Nachbarschaft mit ${otherName}` };
      }
    }

    for (const otherName of otherSeedsInBed) {
      const otherSeed = allSeeds.find(s => s.name === otherName);

      const isGoodSelf = seed.goodNeighbors?.some(good => otherName.toLowerCase().includes(good.toLowerCase()));
      const isGoodOther = otherSeed?.goodNeighbors?.some(good => seedName.toLowerCase().includes(good.toLowerCase()));

      if (isGoodSelf || isGoodOther) {
        return { status: 'good', reason: `Gute Nachbarschaft mit ${otherName}` };
      }
    }

    return { status: 'neutral', reason: 'Keine besonderen Wechselwirkungen bekannt' };
  };

  const handleAddSeed = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newSeed: SeedData = {
      name: formData.get('name') as string,
      category: (formData.get('category') as any) || 'Gemüse',
      instructions: formData.get('instructions') as string || '',
      calendar: {},
      goodNeighbors: (formData.get('goodNeighbors') as string).split(',').map(s => s.trim()).filter(s => s),
      badNeighbors: (formData.get('badNeighbors') as string).split(',').map(s => s.trim()).filter(s => s),
    };

    months.forEach(m => {
      const val = formData.get(`month-${m}`) as string;
      if (val) newSeed.calendar[m] = val;
    });

    try {
      const response = await fetch('/api/save-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seed: newSeed,
          oldName: seedToEdit ? seedToEdit.name : undefined
        }),
      });

      if (response.ok) {
        setIsAddModalOpen(false);
        setSeedToEdit(null);
        window.location.reload(); 
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSeed = async (name: string) => {
    if (!window.confirm(`Möchtest du "${name}" wirklich löschen?`)) return;
    
    try {
      const response = await fetch('/api/delete-seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (response.ok) {
        setSelectedSeed(null);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/trigger-sync', { method: 'POST' });
      // We don't wait for the agent to finish here, 
      // but we signal that research is requested.
      // In this setup, the user will tell the agent "Sync now" 
      // or the agent will notice the request.
      setTimeout(() => setIsSyncing(false), 2000); 
    } catch (err) {
      setIsSyncing(false);
    }
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Leaf className="logo-icon" />
          <h1>GartenPlaner</h1>
        </div>
        <div className="header-actions">
          <div className="search-bar">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Saatgut suchen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="sync-btn" onClick={() => window.open('/2024_Aussaatkalender-Bingenheimer-Saatgut.pdf', '_blank')}>
            <Calendar size={20} /> Kalender (PDF)
          </button>
          <button className="sync-btn" onClick={() => window.open('/Mischkulturen.pdf', '_blank')}>
            <Leaf size={20} /> Mischkulturen (PDF)
          </button>
          <button className={`sync-btn ${isSyncing ? 'loading' : ''}`} onClick={handleSync} disabled={isSyncing}>
            <RefreshCw size={20} /> {isSyncing ? 'Synchronisiere...' : 'Synchronisieren'}
          </button>
          <button className={`sync-btn save-beds-btn ${isSyncing ? 'loading' : ''}`} onClick={handleSaveBedsToCloud} disabled={isSyncing}>
            <Cloud size={20} /> {isSyncing ? 'Sichere...' : 'Planung sichern'}
          </button>
          <button className="add-btn" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={20} /> Saatgut hinzufügen
          </button>
        </div>
      </header>

      <main className="main-content">
        <section className="dashboard-hero">
          <div className="hero-text">
            <h2>Willkommen zurück, Gärtner!</h2>
            <p>Es ist <strong>März</strong>. Die Natur erwacht.</p>
          </div>
          <div className="month-stats">
            <div className="stat-card">
              <Sprout />
              <span>{activeThisMonth.length} Pflanzen aktiv</span>
            </div>
          </div>
        </section>

        <section className="spotlight">
          <h3>🌱 Was du jetzt tun kannst (März)</h3>
          <div className="spotlight-grid">
            <div className="spotlight-card direct">
              <h4>Aussaat Freiland / Pflanzung (Beet)</h4>
              <ul>
                {activeThisMonth.filter(s => s.calendar[currentMonth]?.includes('P') || s.calendar[currentMonth]?.includes('D')).map(s => (
                  <li key={s.name} onClick={() => setSelectedSeed(s)} className="clickable-seed">
                    {s.name} {!s.instructions && <span className="pending-dot" title="Forschung ausstehend" />}
                  </li>
                ))}
              </ul>
            </div>
            <div className="spotlight-card indoor">
              <h4>Voranzucht (Haus)</h4>
              <ul>
                {activeThisMonth.filter(s => s.calendar[currentMonth]?.includes('V')).map(s => (
                  <li key={s.name} onClick={() => setSelectedSeed(s)} className="clickable-seed">
                    {s.name} {!s.instructions && <span className="pending-dot" title="Forschung ausstehend" />}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="calendar-section">
          <div className="section-header">
            <h3>📅 Anbaukalender</h3>
            <div className="calendar-legend">
              <span className="legend-item"><span className="badge v">V</span> Voranzucht</span>
              <span className="legend-item"><span className="badge d">D</span> Direktsaat</span>
              <span className="legend-item"><span className="badge p">P</span> Pflanzung</span>
              <span className="legend-item"><span className="badge e">E</span> Ernte</span>
            </div>
          </div>
          <div className="table-wrapper">
            <table className="calendar-table">
              <thead>
                <tr>
                  <th>Saatgut</th>
                  {months.map(m => (
                    <th key={m} className={m === currentMonth ? 'current-col' : ''}>{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSeeds.map(seed => (
                  <tr key={seed.name} onClick={() => setSelectedSeed(seed)}>
                    <td className="seed-name">
                      <div className="seed-name-main">
                        {seed.name}
                        {!seed.instructions && <span className="pending-badge">Pendent</span>}
                        {seed.nutrientConsumption && (
                          <span className={`nutrient-badge mini ${seed.nutrientConsumption.toLowerCase()}`}>
                            {seed.nutrientConsumption === 'Schwachzehrer' ? 'W' : seed.nutrientConsumption[0]}
                          </span>
                        )}
                      </div>
                      <Info size={14} className="info-trigger" />
                    </td>
                    {months.map(m => {
                      const type = seed.calendar[m];
                      return (
                        <td key={m} className={`cell ${type ? 'active' : ''} ${m === currentMonth ? 'current-col' : ''}`}>
                          {type && <span className={`badge ${type.includes('V') ? 'v' : ''} ${type.includes('D') ? 'd' : ''} ${type.includes('P') ? 'p' : ''} ${type.includes('E') ? 'e' : ''}`}>{type}</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="beds-section">
          <div className="section-header">
            <h3>🧺 Meine Beete</h3>
            <button className="add-bed-btn" onClick={handleAddBed}>
              <Plus size={18} /> Beet hinzufügen
            </button>
          </div>
          <div className="beds-grid">
            {beds.map((bed) => (
              <div key={bed.id} className="bed-card">
                <div className="bed-header">
                  <div className="bed-header-left">
                    <input 
                      className="bed-name-input"
                      value={bed.name}
                      onChange={(e) => handleUpdateBedName(bed.id, e.target.value)}
                    />
                    <button 
                      className={`gallery-trigger-btn ${(bed.images && bed.images.length > 0) ? 'has-images' : ''}`}
                      onClick={() => setSelectedBedForGallery(bed)}
                      title="Galerie öffnen"
                    >
                      <Camera size={16} />
                      {bed.images && bed.images.length > 0 && <span className="image-count">{bed.images.length}</span>}
                    </button>
                  </div>
                  <button className="remove-bed-btn" onClick={() => handleRemoveBed(bed.id)} title="Beet löschen">
                    <X size={16} />
                  </button>
                </div>
                <div className="bed-content">
                  <div className="bed-rows-list">
                    {bed.rows.map((row, rowIndex) => {
                      const { status, reason } = getCompanionInfo(row.seedName, bed.rows);
                      const seed = allSeeds.find(s => s.name === row.seedName);
                      return (
                        <div 
                          key={`${bed.id}-row-${rowIndex}`} 
                          className={`bed-row status-${status}`}
                          title={reason}
                        >
                          <span className="row-number">{rowIndex + 1}</span>
                          <div className="row-seed-tag">
                            <div className="row-seed-info-wrapper">
                              {seed?.nutrientConsumption && (
                                <span className={`nutrient-badge mini ${seed.nutrientConsumption.toLowerCase()}`} title={seed.nutrientConsumption}>
                                  {seed.nutrientConsumption === 'Schwachzehrer' ? 'W' : seed.nutrientConsumption[0]}
                                </span>
                              )}
                              <span>{row.seedName}</span>
                            </div>
                            <button 
                              className="remove-row-btn" 
                              onClick={() => handleRemoveRow(bed.id, rowIndex)}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <select 
                    value="" 
                    onChange={(e) => handleAddRow(bed.id, e.target.value)}
                    className="bed-select add-to-bed"
                  >
                    <option value="" disabled>+ Reihe hinzufügen</option>
                    <optgroup label="Optionen">
                      <option value="ADD_NEW">+ Neue Pflanze anlegen...</option>
                    </optgroup>
                    <optgroup label="Saatgut">
                      {allSeeds.map(seed => (
                        <option key={seed.name} value={seed.name}>{seed.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Add Seed Modal */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => { setIsAddModalOpen(false); setSeedToEdit(null); }}>
          <div className="modal-content add-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => { setIsAddModalOpen(false); setSeedToEdit(null); }}><X /></button>
            <h2>{seedToEdit ? 'Saatgut bearbeiten' : 'Neues Saatgut'}</h2>
            <form onSubmit={handleAddSeed} className="add-form">
              <div className="form-group">
                <label>Name</label>
                <input name="name" required defaultValue={seedToEdit?.name || ''} placeholder="z.B. Tomate 'Rotkäppchen'" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Kategorie</label>
                  <select name="category" defaultValue={seedToEdit?.category || 'Gemüse'}>
                    <option value="Gemüse">Gemüse</option>
                    <option value="Kräuter">Kräuter</option>
                    <option value="Radieschen">Radieschen</option>
                    <option value="Blumen">Blumen</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Anbauhinweise</label>
                <textarea name="instructions" rows={3} defaultValue={seedToEdit?.instructions || ''} placeholder="Tipps zur Aussaat..."></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Gute Nachbarn (kommagetrennt)</label>
                  <input name="goodNeighbors" defaultValue={seedToEdit?.goodNeighbors?.join(', ') || ''} placeholder="Bohnen, Erbsen..." />
                </div>
                <div className="form-group">
                  <label>Schlechte Nachbarn (kommagetrennt)</label>
                  <input name="badNeighbors" defaultValue={seedToEdit?.badNeighbors?.join(', ') || ''} placeholder="Knoblauch, Zwiebeln..." />
                </div>
              </div>
              
              <div className="calendar-input-grid">
                <label style={{ gridColumn: '1 / -1' }}>Anbaukalender (V=Voranzucht, D=Direktsaat, P=Pflanzung)</label>
                {months.map(m => (
                  <div key={m} className="month-input">
                    <span>{m}</span>
                    <input name={`month-${m}`} defaultValue={seedToEdit?.calendar[m] || ''} placeholder="V/D/P" maxLength={5} />
                  </div>
                ))}
              </div>

              <button type="submit" className="submit-btn">{seedToEdit ? 'Aktualisieren' : 'Speichern'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedSeed && (
        <div className="modal-overlay" onClick={() => setSelectedSeed(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedSeed(null)}><X /></button>
            <div className="modal-header-actions">
              <h2>{selectedSeed.name}</h2>
              <div className="action-buttons">
                <button 
                  className="edit-seed-btn" 
                  onClick={() => {
                    setSeedToEdit(selectedSeed);
                    setIsAddModalOpen(true);
                    setSelectedSeed(null);
                  }}
                  title="Bearbeiten"
                >
                  <Edit size={18} />
                </button>
                <button 
                  className="delete-seed-btn" 
                  onClick={() => handleDeleteSeed(selectedSeed.name)}
                  title="Löschen"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="tags-row">
              <span className="category-tag">{selectedSeed.category}</span>
              {selectedSeed.nutrientConsumption && (
                <span className={`nutrient-badge ${selectedSeed.nutrientConsumption.toLowerCase()}`}>
                  {selectedSeed.nutrientConsumption}
                </span>
              )}
            </div>
            
            <div className="instructions">
              <h4>Anbauhinweise</h4>
              <p>{selectedSeed.instructions}</p>
              <div className="variety-hint">
                <Info size={12} />
                <span>Hinweis: Anbauzeiträume können je nach Sorte variieren.</span>
              </div>
            </div>

            <div className="companion-planting">
              <div className="companion-block good">
                <h4><ThumbsUp size={16} /> Gute Nachbarn</h4>
                <p>{selectedSeed.goodNeighbors && selectedSeed.goodNeighbors.length > 0 
                  ? selectedSeed.goodNeighbors.join(', ') 
                  : 'Keine spezifischen Angaben'}</p>
              </div>
              <div className="companion-block bad">
                <h4><ThumbsDown size={16} /> Schlechte Nachbarn</h4>
                <p>{selectedSeed.badNeighbors && selectedSeed.badNeighbors.length > 0 
                  ? selectedSeed.badNeighbors.join(', ') 
                  : 'Keine spezifischen Angaben'}</p>
              </div>
            </div>

            <div className="mini-calendar">
              {months.map(m => (
                <div key={m} className={`mini-cell ${selectedSeed.calendar[m] ? 'active' : ''}`}>
                  <span className="month-name">{m}</span>
                  <span className="month-val">{selectedSeed.calendar[m] || '-'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Gallery Modal */}
      {selectedBedForGallery && (
        <div className="modal-overlay" onClick={() => setSelectedBedForGallery(null)}>
          <div className="modal-content gallery-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedBedForGallery(null)}><X /></button>
            <div className="gallery-header">
              <h2>Entwicklung: {selectedBedForGallery.name}</h2>
              <div className="gallery-actions">
                <button 
                  className="add-image-btn secondary"
                  onClick={fetchAssets}
                >
                  <ImageIcon size={18} /> Asset wählen
                </button>
                <button 
                  className="add-image-btn"
                  onClick={() => handleAddImageToBed(selectedBedForGallery.id)}
                >
                  <Camera size={18} /> URL hinzufügen
                </button>
              </div>
            </div>

            <div className="gallery-grid">
              {(!selectedBedForGallery.images || selectedBedForGallery.images.length === 0) ? (
                <div className="empty-gallery">
                  <ImageIcon size={48} />
                  <p>Noch keine Fotos für dieses Beet vorhanden.</p>
                </div>
              ) : (
                selectedBedForGallery.images.map((url, idx) => (
                  <div key={idx} className="gallery-item">
                    {imageErrors[url] ? (
                      <div className="broken-image">
                        <ImageIcon size={24} />
                        <span>Link ungültig</span>
                      </div>
                    ) : (
                      <img 
                        src={url} 
                        alt={`Entwicklung Schritt ${idx + 1}`} 
                        onError={() => handleImageError(url)}
                      />
                    )}
                    <button 
                      className="delete-image-btn"
                      onClick={() => handleRemoveImageFromBed(selectedBedForGallery.id, url)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Asset Selector Modal */}
      {isAssetSelectorOpen && (
        <div className="modal-overlay asset-selector-overlay" onClick={() => setIsAssetSelectorOpen(false)}>
          <div className="modal-content asset-selector-modal" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setIsAssetSelectorOpen(false)}><X /></button>
            <h2>Bilder aus /public/images/</h2>
            <p className="asset-hint">Kopiere deine Bilder in den Projektordner, um sie hier zu sehen.</p>
            <div className="asset-grid">
              {availableAssets.length === 0 ? (
                <div className="empty-assets">
                  <p>Keine Bilder im Ordner <code>public/images/</code> gefunden.</p>
                </div>
              ) : (
                availableAssets.map(file => (
                  <div key={file} className="asset-item" onClick={() => handleAssetSelect(file)}>
                    <img src={`/images/${file}`} alt={file} />
                    <span className="asset-name">{file}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
