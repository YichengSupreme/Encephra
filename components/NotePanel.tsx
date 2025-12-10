import React, { useEffect, useState, useRef, useMemo } from 'react';
import { X, Tag, Calendar, Save, GripVertical, Eye, PenTool, Image as ImageIcon, Plus, Check } from 'lucide-react';
import { NodeData } from '../types';
import { stringToColor } from './SceneComponents'; 

interface NotePanelProps {
  node: NodeData | null;
  allNodes: NodeData[]; // To find existing tags
  onClose: () => void;
  onUpdate: (updatedNode: NodeData) => void;
  tagColors: Record<string, string>;
  onTagColorChange: (tag: string, color: string) => void;
}

export const NotePanel: React.FC<NotePanelProps> = ({ node, allNodes, onClose, onUpdate, tagColors, onTagColorChange }) => {
  const [localNode, setLocalNode] = useState<NodeData | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  
  // Tagging State
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (node) {
      setLocalNode({ ...node });
      setViewMode('edit'); 
      setIsAddingTag(false);
    }
  }, [node]);

  // Focus input when adding tag
  useEffect(() => {
      if (isAddingTag && tagInputRef.current) {
          tagInputRef.current.focus();
      }
  }, [isAddingTag]);

  // Compute all unique available tags
  const availableTags = useMemo(() => {
      const tags = new Set<string>();
      allNodes.forEach(n => n.tags.forEach(t => tags.add(t)));
      return Array.from(tags).sort();
  }, [allNodes]);

  // Filter available tags for suggestion (exclude ones already on this node)
  const suggestedTags = useMemo(() => {
      if (!localNode) return [];
      const currentTags = new Set(localNode.tags);
      return availableTags.filter(t => 
          !currentTags.has(t) && 
          t.toLowerCase().includes(tagInput.toLowerCase())
      );
  }, [availableTags, localNode, tagInput]);

  const handleSave = () => {
    if (localNode) {
      onUpdate(localNode);
    }
  };

  const addTag = (tag: string) => {
      if (!localNode) return;
      const cleanTag = tag.trim();
      if (cleanTag && !localNode.tags.includes(cleanTag)) {
          const newNode = { ...localNode, tags: [...localNode.tags, cleanTag] };
          setLocalNode(newNode);
          onUpdate(newNode);
      }
      setTagInput("");
      setIsAddingTag(false);
  };

  // Tag Drag Logic
  const dragItemRef = useRef<number | null>(null);
  const dragOverItemRef = useRef<number | null>(null);

  const handleDragStart = (index: number) => {
    dragItemRef.current = index;
  };
  const handleDragEnter = (index: number) => {
    dragOverItemRef.current = index;
  };
  const handleDragEnd = () => {
    if (localNode && dragItemRef.current !== null && dragOverItemRef.current !== null) {
        const copyTags = [...localNode.tags];
        const dragItemContent = copyTags[dragItemRef.current];
        copyTags.splice(dragItemRef.current, 1);
        copyTags.splice(dragOverItemRef.current, 0, dragItemContent);
        const newNode = { ...localNode, tags: copyTags };
        setLocalNode(newNode);
        onUpdate(newNode);
    }
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  const getTagColor = (tag: string) => {
      return tagColors[tag.toLowerCase()] || stringToColor(tag);
  };

  // --- Image Drag & Drop Logic ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    
    if (!localNode) return;

    const files = Array.from(e.dataTransfer.files) as File[];
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const markdownImage = `\n![${imageFile.name}](${base64})\n`;
            
            // Insert at cursor position if possible
            if (textAreaRef.current) {
                const start = textAreaRef.current.selectionStart;
                const end = textAreaRef.current.selectionEnd;
                const text = localNode.content;
                const newText = text.substring(0, start) + markdownImage + text.substring(end);
                setLocalNode({ ...localNode, content: newText });
            } else {
                setLocalNode({ ...localNode, content: localNode.content + markdownImage });
            }
        };
        reader.readAsDataURL(imageFile);
    }
  };

  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
        if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold text-white mb-4 mt-6">{line.substring(2)}</h1>;
        if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-semibold text-cyan-200 mb-3 mt-5">{line.substring(3)}</h2>;
        if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-slate-300 mb-1">{line.substring(2)}</li>;
        if (line.startsWith('> ')) return <blockquote key={i} className="border-l-2 border-cyan-500 pl-4 italic text-slate-400 my-4">{line.substring(2)}</blockquote>;
        if (line.startsWith('[ ] ')) return <div key={i} className="flex items-center gap-2 my-2 text-slate-400"><div className="w-4 h-4 border border-slate-600 rounded"></div>{line.substring(4)}</div>;
        if (line.match(/^!\[.*\]\(data:image\/.*;base64,.*\)$/)) {
            // Basic regex to catch the image pattern we just inserted
            const match = line.match(/^!\[(.*)\]\((.*)\)$/);
            if (match) {
                return <img key={i} src={match[2]} alt={match[1]} className="max-w-full rounded-lg border border-white/10 my-4 shadow-lg" />;
            }
        }
        if (line.trim() === '') return <div key={i} className="h-4"></div>;
        return <p key={i} className="text-slate-300 mb-2 leading-relaxed">{line}</p>;
    });
  };

  if (!localNode) return null;
  
  const primaryTagColor = localNode.tags.length > 0 ? getTagColor(localNode.tags[0]) : '#64748b';

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex justify-between items-start shrink-0">
        <div className="flex flex-col gap-2 w-full mr-4">
           {/* Primary Tag Indicator */}
           <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-widest mb-1">
              <span className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{backgroundColor: primaryTagColor, boxShadow: `0 0 8px ${primaryTagColor}`}}></span>
              <span style={{color: primaryTagColor}}>{localNode.tags[0] || 'Uncategorized'}</span>
           </div>
           
           <input 
             type="text" 
             value={localNode.title}
             onChange={(e) => setLocalNode(prev => prev ? {...prev, title: e.target.value} : null)}
             className="bg-transparent text-3xl font-bold text-white outline-none placeholder-white/20 w-full"
             placeholder="Untitled Thought"
           />
        </div>
        <div className="flex gap-2 shrink-0">
            <button 
                onClick={handleSave}
                className="p-2 hover:bg-white/10 rounded-lg text-cyan-400 transition-colors"
                title="Save changes"
            >
                <Save className="w-5 h-5" />
            </button>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Properties & Tags */}
      <div className="px-6 py-4 space-y-4 border-b border-white/5 bg-white/5 shrink-0 relative z-50">
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Tag className="w-4 h-4" />
                <span className="text-sm font-semibold">Tags</span>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center">
                {localNode.tags.map((tag, index) => {
                    const tagColor = getTagColor(tag);
                    const isPrimary = index === 0;

                    return (
                        <div 
                            key={`${tag}-${index}`}
                            draggable={viewMode === 'edit'}
                            onDragStart={() => handleDragStart(index)}
                            onDragEnter={() => handleDragEnter(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className={`
                                group flex items-center gap-2 pl-1 pr-2 py-1 rounded border text-xs transition-all relative overflow-hidden
                                ${isPrimary ? 'bg-white/5' : 'bg-transparent'}
                                ${viewMode === 'edit' ? 'cursor-move hover:bg-white/5' : ''}
                            `}
                            style={{borderColor: `${tagColor}40`}}
                        >
                            {viewMode === 'edit' && <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/50" />}
                            
                            <label 
                                className="w-3 h-3 rounded-full cursor-pointer hover:scale-110 transition-transform flex-shrink-0 relative" 
                                style={{backgroundColor: tagColor}}
                                title="Change tag color"
                            >
                                <input 
                                    type="color" 
                                    value={tagColor}
                                    onChange={(e) => onTagColorChange(tag, e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </label>

                            <span style={{color: isPrimary ? tagColor : '#cbd5e1'}}>#{tag}</span>
                            
                            <button 
                                onClick={() => {
                                    const newTags = localNode.tags.filter((_, i) => i !== index);
                                    setLocalNode({...localNode, tags: newTags});
                                    onUpdate({...localNode, tags: newTags});
                                }}
                                className="ml-1 text-slate-600 hover:text-red-400"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
                
                {/* Add Tag UI */}
                <div className="relative">
                    {!isAddingTag ? (
                        <button 
                            onClick={() => setIsAddingTag(true)}
                            className="px-2 py-1 flex items-center gap-1 rounded border border-dashed border-white/20 text-xs text-slate-500 hover:text-slate-300 hover:border-white/40 transition-all"
                        >
                            <Plus className="w-3 h-3" /> Add
                        </button>
                    ) : (
                        <div className="relative">
                            <input 
                                ref={tagInputRef}
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') addTag(tagInput);
                                    if (e.key === 'Escape') setIsAddingTag(false);
                                }}
                                onBlur={() => {
                                    // Delay hiding to allow click events on dropdown
                                    setTimeout(() => setIsAddingTag(false), 200);
                                }}
                                className="px-2 py-1 w-32 bg-black/50 border border-cyan-500/50 rounded text-xs text-white outline-none"
                                placeholder="Type..."
                            />
                            
                            {/* Suggestions Dropdown */}
                            <div className="absolute top-full left-0 mt-1 w-48 max-h-48 overflow-y-auto bg-[#0a0a0c] border border-white/20 rounded-lg shadow-2xl custom-scrollbar z-50">
                                {suggestedTags.length > 0 ? (
                                    suggestedTags.map(tag => (
                                        <div 
                                            key={tag}
                                            onMouseDown={() => addTag(tag)} // MouseDown fires before Blur
                                            className="px-3 py-2 text-xs text-slate-300 hover:bg-white/10 hover:text-white cursor-pointer flex items-center justify-between"
                                        >
                                            <span>#{tag}</span>
                                            <span 
                                                className="w-2 h-2 rounded-full" 
                                                style={{backgroundColor: getTagColor(tag)}}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    tagInput && (
                                        <div 
                                            onMouseDown={() => addTag(tagInput)}
                                            className="px-3 py-2 text-xs text-cyan-400 hover:bg-white/10 cursor-pointer"
                                        >
                                            Create "#{tagInput}"
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-2 border-b border-white/5 flex justify-end gap-2">
          <button 
            onClick={() => setViewMode('edit')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${viewMode === 'edit' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
              <PenTool className="w-3 h-3" /> Edit
          </button>
          <button 
            onClick={() => setViewMode('preview')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs transition-colors ${viewMode === 'preview' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
              <Eye className="w-3 h-3" /> Preview
          </button>
      </div>

      {/* Content Editor / Preview */}
      <div 
        className={`flex-1 p-6 overflow-y-auto custom-scrollbar relative transition-colors duration-200 ${isDraggingFile ? 'bg-cyan-900/20' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDraggingFile && (
            <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                <div className="bg-black/80 backdrop-blur rounded-xl p-8 border-2 border-dashed border-cyan-400 text-cyan-400 flex flex-col items-center gap-4">
                    <ImageIcon className="w-12 h-12" />
                    <span className="text-lg font-bold">Drop Image to Embed</span>
                </div>
            </div>
        )}

        {viewMode === 'edit' ? (
            <textarea
                ref={textAreaRef}
                value={localNode.content}
                onChange={(e) => setLocalNode(prev => prev ? {...prev, content: e.target.value} : null)}
                className="w-full h-full bg-transparent text-slate-300 resize-none outline-none font-mono text-sm leading-relaxed placeholder-slate-600"
                placeholder="Start typing your thoughts..."
                spellCheck={false}
            />
        ) : (
            <div className="prose prose-invert prose-sm max-w-none">
                {renderMarkdown(localNode.content)}
            </div>
        )}
      </div>
    </div>
  );
};