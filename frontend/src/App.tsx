import React, { useState, useEffect, useRef } from 'react';
import { File as FileIcon, Download, RefreshCw, Zap, UploadCloud, Trash2, Shield } from 'lucide-react';
import { supabase } from './supabaseClient';
import './index.css';

interface FileItem {
  name: string;
  created_at: string;
  url?: string;
  size?: number;
}

function App() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage.from('sync_files').list();
      if (error) throw error;
      
      const validFiles = data?.filter(f => f.name !== '.emptyFolderPlaceholder') || [];
      
      const filesWithUrls = await Promise.all(validFiles.map(async (f) => {
        const { data: urlData } = supabase.storage.from('sync_files').getPublicUrl(f.name);
        return { 
          ...f, 
          url: urlData.publicUrl, 
          size: f.metadata?.size,
          created_at: f.created_at || new Date().toISOString()
        };
      }));

      setFiles(filesWithUrls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (err) {
      console.error("Error fetching files:", err);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
      const uniqueName = `${Date.now()}_${safeName}`;
      
      const { error } = await supabase.storage.from('sync_files').upload(uniqueName, file, {
        upsert: true
      });
      
      if (error) throw error;
      await fetchFiles();
    } catch (err: any) {
      alert(`Error uploading file: ${err.message || JSON.stringify(err)}`);
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (e: React.MouseEvent, filename: string) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    
    try {
      const { error } = await supabase.storage.from('sync_files').remove([filename]);
      if (error) throw error;
      await fetchFiles();
    } catch (err: any) {
      console.error(err);
      alert(`Error deleting file: ${err.message}`);
    }
  };

  const formatBytes = (bytes: number = 0) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getCleanName = (fullName: string) => {
    const parts = fullName.split('_');
    if (parts.length > 1 && !isNaN(Number(parts[0]))) {
      return parts.slice(1).join('_');
    }
    return fullName;
  };

  return (
    <div className="min-h-screen bg-[#141414] text-[#E5E5E5] font-sans selection:bg-[#E50914]/40 relative overflow-x-hidden flex flex-col items-center">
      
      {/* Subtle red cinematic glow at the top */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E50914] rounded-[100%] opacity-5 blur-[120px] pointer-events-none z-0"></div>

      <div className="w-full max-w-4xl px-6 py-16 relative z-10 flex flex-col gap-14">
        
        {/* Header - Netflix Cinematic Style */}
        <header className="flex flex-col gap-4 items-center text-center animate-cinematic-float">
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#FFFFFF] to-[#B3B3B3] drop-shadow-2xl">
            Omni<span className="text-[#E50914]">Drop</span>
          </h1>
          <p className="text-[#808080] text-lg font-medium flex items-center gap-3 tracking-wide">
            <Zap className="w-5 h-5 text-[#E50914]" /> 
            Seamless File Transfer
          </p>
        </header>

        {/* Main Interface */}
        <main className="flex flex-col gap-12 w-full max-w-xl mx-auto">
          
          {/* Neumorphic Upload Button */}
          <div 
            className={`w-full group cursor-pointer transition-all duration-300 ease-out select-none ${uploading ? 'neu-inset scale-95' : 'neu-outset hover:scale-[1.02]'}`}
            onClick={() => !uploading && fileInputRef.current?.click()}
          >
            <div className="p-10 flex flex-col items-center text-center justify-center min-h-[220px]">
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              
              {uploading ? (
                <div className="flex flex-col items-center animate-pulse">
                  <div className="w-20 h-20 rounded-full neu-inset-sm flex items-center justify-center mb-6">
                    <RefreshCw className="w-8 h-8 text-[#E50914] animate-spin" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-wide text-white">Transferring...</h3>
                  <p className="text-[#808080] text-sm mt-2 font-medium">Injecting file into network</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 rounded-full neu-outset-sm flex items-center justify-center mb-6 group-hover:accent-glow transition-all duration-300">
                    <UploadCloud className="w-8 h-8 text-[#B3B3B3] group-hover:text-[#E50914] transition-colors" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-wide text-white">Tap to Drop</h3>
                  <p className="text-[#808080] text-sm mt-2 font-medium">Send any file instantly to your devices</p>
                </div>
              )}
            </div>
          </div>

          {/* Network Files Card - Only visible when files exist */}
          {files.length > 0 && (
            <div className="w-full flex flex-col gap-6 transition-all duration-500 ease-in-out opacity-100 translate-y-0">
              
              <div className="flex items-center justify-between border-b border-[#333] pb-3">
                <h2 className="text-xl font-bold text-white tracking-wide">Network Files</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-[#E50914]/10 rounded-full border border-[#E50914]/20">
                  <span className="flex h-2 w-2 rounded-full bg-[#E50914] animate-pulse"></span>
                  <div className="text-xs font-bold tracking-widest text-[#E50914] uppercase">Live</div>
                </div>
              </div>

              {/* Netflix Movie Card Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {files.map((file) => (
                  <a 
                    key={file.name}
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="netflix-card bg-[#181818] rounded-lg overflow-hidden border border-[#333] flex flex-col group relative h-32 cursor-pointer"
                  >
                    {/* Fake Video Thumbnail Area */}
                    <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-[#E50914]/20 to-transparent z-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                    
                    <div className="p-4 flex flex-col justify-between h-full relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-[#141414] border border-[#333] flex items-center justify-center group-hover:border-[#E50914]/50 transition-colors">
                            <FileIcon className="w-4 h-4 text-[#B3B3B3] group-hover:text-white" />
                          </div>
                          <div className="flex flex-col max-w-[140px]">
                            <p className="text-sm font-bold text-white truncate" title={getCleanName(file.name)}>
                              {getCleanName(file.name)}
                            </p>
                            <p className="text-xs font-medium text-[#808080] mt-0.5">{formatBytes(file.size)}</p>
                          </div>
                        </div>
                      </div>

                      {/* Actions Bottom Right */}
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-100 transition-all duration-300">
                        <button 
                          onClick={(e) => handleDelete(e, file.name)}
                          className="w-8 h-8 rounded-full bg-[#181818] border border-[#333] flex items-center justify-center hover:bg-[#E50914] hover:border-[#E50914] transition-colors"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4 text-[#B3B3B3] hover:text-white transition-colors" />
                        </button>
                        <div className="w-8 h-8 rounded-full bg-[#E50914] flex items-center justify-center shadow-lg shadow-[#E50914]/30">
                          <Download className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Progress bar simulation at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#333]">
                      <div className="h-full bg-[#E50914] w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 ease-out"></div>
                    </div>
                  </a>
                ))}
              </div>
              
            </div>
          )}
          
        </main>

        {/* Privacy Notice Footer */}
        <footer className="w-full flex justify-center mt-4 mb-8">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#181818]/60 border border-[#333]/50 backdrop-blur-sm max-w-lg text-center">
            <Shield className="w-5 h-5 text-[#B3B3B3] flex-shrink-0" />
            <p className="text-xs text-[#808080] font-medium leading-relaxed tracking-wide">
              Your privacy is our top priority. We do not permanently save your data. All files are <span className="text-[#E5E5E5] font-semibold">automatically deleted from our servers within 1 hour</span>.
            </p>
          </div>
        </footer>

      </div>
    </div>
  );
}

export default App;
