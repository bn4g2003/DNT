/**
 * Resource Library Page
 * Thư viện tài nguyên: video, tài liệu, link web với hệ thống phân nhánh
 */

import React, { useState, useEffect } from 'react';
import {
  FolderPlus, FilePlus, Folder, Video, FileText, Link2, Image, Music,
  ChevronRight, Search, Edit, Trash2, X, Eye, Download, ExternalLink,
  Plus, Home, Grid, List
} from 'lucide-react';
import * as resourceService from '../src/services/resourceService';
import { Resource, ResourceFolder, ResourceType } from '../types';

const TYPE_ICONS: Record<ResourceType, React.ElementType> = {
  video: Video,
  document: FileText,
  link: Link2,
  image: Image,
  audio: Music,
};

const TYPE_COLORS: Record<ResourceType, string> = {
  video: 'text-red-500 bg-red-50',
  document: 'text-blue-500 bg-blue-50',
  link: 'text-green-500 bg-green-50',
  image: 'text-purple-500 bg-purple-50',
  audio: 'text-orange-500 bg-orange-50',
};

const TYPE_LABELS: Record<ResourceType, string> = {
  video: 'Video',
  document: 'Tài liệu',
  link: 'Link web',
  image: 'Hình ảnh',
  audio: 'Audio',
};

const FOLDER_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f97316', 
  '#eab308', '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6'
];

export const ResourceLibrary: React.FC = () => {
  const [folders, setFolders] = useState<ResourceFolder[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [allFolders, setAllFolders] = useState<ResourceFolder[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<ResourceFolder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Resource[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modals
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ResourceFolder | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  
  // Form states
  const [folderForm, setFolderForm] = useState({ name: '', description: '', color: '#6366f1' });
  const [resourceForm, setResourceForm] = useState<Partial<Resource>>({
    name: '', type: 'document', url: '', description: '', tags: []
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchData();
  }, [currentFolderId]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      handleSearch();
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [allFoldersData, allResourcesData] = await Promise.all([
        resourceService.getAllFolders(),
        resourceService.getAllResources(),
      ]);
      
      setAllFolders(allFoldersData);
      setAllResources(allResourcesData);
      
      // Filter for current level
      const currentFolders = allFoldersData.filter(f => 
        currentFolderId ? f.parentId === currentFolderId : !f.parentId
      );
      const currentResources = allResourcesData.filter(r => 
        currentFolderId ? r.folderId === currentFolderId : !r.folderId
      );
      
      setFolders(currentFolders);
      setResources(currentResources);
      
      // Build breadcrumb
      if (currentFolderId) {
        const path: ResourceFolder[] = [];
        let folderId: string | null | undefined = currentFolderId;
        while (folderId) {
          const folder = allFoldersData.find(f => f.id === folderId);
          if (folder) {
            path.unshift(folder);
            folderId = folder.parentId;
          } else {
            break;
          }
        }
        setBreadcrumb(path);
      } else {
        setBreadcrumb([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const results = await resourceService.searchResources(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchTerm('');
    setIsSearching(false);
  };

  // Count items in folder (recursive)
  const getFolderItemCount = (folderId: string): number => {
    const directSubFolders = allFolders.filter(f => f.parentId === folderId);
    const directResources = allResources.filter(r => r.folderId === folderId);
    
    // Count direct items + items in subfolders
    let count = directResources.length;
    for (const subFolder of directSubFolders) {
      count += 1; // Count the subfolder itself
      count += getFolderItemCount(subFolder.id); // Recursive count
    }
    return count;
  };

  // Folder CRUD
  const handleSaveFolder = async () => {
    try {
      if (!folderForm.name.trim()) {
        alert('Vui lòng nhập tên thư mục');
        return;
      }
      
      if (editingFolder) {
        await resourceService.updateFolder(editingFolder.id, {
          name: folderForm.name,
          description: folderForm.description,
          color: folderForm.color,
        });
      } else {
        await resourceService.createFolder({
          name: folderForm.name,
          description: folderForm.description,
          color: folderForm.color,
          parentId: currentFolderId || undefined,
          createdAt: new Date().toISOString(),
        });
      }
      setShowFolderModal(false);
      setEditingFolder(null);
      setFolderForm({ name: '', description: '', color: '#6366f1' });
      fetchData();
    } catch (error) {
      console.error('Error saving folder:', error);
      alert('Lỗi lưu thư mục');
    }
  };

  const handleDeleteFolder = async (folder: ResourceFolder) => {
    if (!confirm(`Xóa thư mục "${folder.name}" và tất cả nội dung bên trong?`)) return;
    try {
      await resourceService.deleteFolder(folder.id);
      fetchData();
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Lỗi xóa thư mục');
    }
  };

  // Resource CRUD
  const handleSaveResource = async () => {
    try {
      if (!resourceForm.name || !resourceForm.type) {
        alert('Vui lòng nhập tên và loại tài nguyên');
        return;
      }
      
      if (editingResource) {
        await resourceService.updateResource(editingResource.id, resourceForm);
      } else {
        await resourceService.createResource({
          ...resourceForm as Omit<Resource, 'id'>,
          folderId: currentFolderId || undefined,
          createdAt: new Date().toISOString(),
        });
      }
      setShowResourceModal(false);
      setEditingResource(null);
      setResourceForm({ name: '', type: 'document', url: '', description: '', tags: [] });
      fetchData();
    } catch (error) {
      console.error('Error saving resource:', error);
      alert('Lỗi lưu tài nguyên');
    }
  };

  const handleDeleteResource = async (resource: Resource) => {
    if (!confirm(`Xóa "${resource.name}"?`)) return;
    try {
      await resourceService.deleteResource(resource.id);
      fetchData();
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Lỗi xóa tài nguyên');
    }
  };

  const handleViewResource = async (resource: Resource) => {
    await resourceService.incrementViewCount(resource.id);
    if (resource.url) {
      window.open(resource.url, '_blank');
    } else if (resource.fileUrl) {
      window.open(resource.fileUrl, '_blank');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !resourceForm.tags?.includes(tagInput.trim())) {
      setResourceForm({ ...resourceForm, tags: [...(resourceForm.tags || []), tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setResourceForm({ ...resourceForm, tags: resourceForm.tags?.filter(t => t !== tag) });
  };

  const openCreateFolder = () => {
    setEditingFolder(null);
    setFolderForm({ name: '', description: '', color: FOLDER_COLORS[Math.floor(Math.random() * FOLDER_COLORS.length)] });
    setShowFolderModal(true);
  };

  const openEditFolder = (folder: ResourceFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setFolderForm({ name: folder.name, description: folder.description || '', color: folder.color || '#6366f1' });
    setShowFolderModal(true);
  };

  const openEditResource = (resource: Resource) => {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name, type: resource.type, url: resource.url,
      description: resource.description, tags: resource.tags || [],
    });
    setShowResourceModal(true);
  };

  const displayResources = isSearching ? searchResults : resources;


  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Thư viện tài nguyên</h1>
        <p className="text-gray-500 mt-1">Quản lý video, tài liệu, link web theo thư mục</p>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1 text-sm flex-1 min-w-0">
            <button
              onClick={() => navigateToFolder(null)}
              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 ${!currentFolderId ? 'font-semibold text-indigo-600' : 'text-gray-600'}`}
            >
              <Home size={16} />
              <span>Thư viện</span>
            </button>
            {breadcrumb.map((folder, idx) => (
              <React.Fragment key={folder.id}>
                <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                <button
                  onClick={() => navigateToFolder(folder.id)}
                  className={`px-2 py-1 rounded hover:bg-gray-100 truncate max-w-[150px] ${idx === breadcrumb.length - 1 ? 'font-semibold text-indigo-600' : 'text-gray-600'}`}
                  title={folder.name}
                >
                  {folder.name}
                </button>
              </React.Fragment>
            ))}
          </div>
          
          {/* Search */}
          <div className="relative w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* View Mode */}
          <div className="flex border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Grid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <List size={18} />
            </button>
          </div>

          {/* Actions */}
          <button onClick={openCreateFolder} className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
            <FolderPlus size={16} /> Thư mục
          </button>
          <button
            onClick={() => { setEditingResource(null); setResourceForm({ name: '', type: 'document', url: '', description: '', tags: [] }); setShowResourceModal(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            <FilePlus size={16} /> Tài nguyên
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Folders */}
          {!isSearching && folders.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Folder size={16} /> Thư mục ({folders.length})
              </h3>
              <div className={viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3" : "space-y-2"}>
                {folders.map(folder => (
                  <div
                    key={folder.id}
                    onClick={() => navigateToFolder(folder.id)}
                    className={`group relative bg-white border rounded-lg hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer ${viewMode === 'grid' ? 'p-4' : 'p-3 flex items-center gap-3'}`}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        <div className="flex flex-col items-center text-center">
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${folder.color || '#6366f1'}20` }}>
                            <Folder size={28} style={{ color: folder.color || '#6366f1' }} />
                          </div>
                          <span className="text-sm font-medium text-gray-900 truncate w-full">{folder.name}</span>
                          <span className="text-xs text-gray-400 mt-0.5">{getFolderItemCount(folder.id)} mục</span>
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1">
                          <button onClick={(e) => openEditFolder(folder, e)} className="p-1.5 bg-white rounded-full shadow hover:bg-gray-100">
                            <Edit size={12} className="text-gray-600" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }} className="p-1.5 bg-white rounded-full shadow hover:bg-red-50">
                            <Trash2 size={12} className="text-red-500" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${folder.color || '#6366f1'}20` }}>
                          <Folder size={22} style={{ color: folder.color || '#6366f1' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 block truncate">{folder.name}</span>
                          <span className="text-xs text-gray-400">{getFolderItemCount(folder.id)} mục</span>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                          <button onClick={(e) => openEditFolder(folder, e)} className="p-1.5 hover:bg-gray-100 rounded"><Edit size={14} className="text-gray-600" /></button>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder); }} className="p-1.5 hover:bg-red-50 rounded"><Trash2 size={14} className="text-red-500" /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
              <FileText size={16} />
              {isSearching ? `Kết quả tìm kiếm (${displayResources.length})` : `Tài nguyên (${displayResources.length})`}
            </h3>
            {displayResources.length === 0 ? (
              <div className="bg-white border rounded-xl p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500">{isSearching ? 'Không tìm thấy tài nguyên' : 'Chưa có tài nguyên nào'}</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
                {displayResources.map(resource => {
                  const Icon = TYPE_ICONS[resource.type];
                  const colorClass = TYPE_COLORS[resource.type];
                  return viewMode === 'grid' ? (
                    <div key={resource.id} className="bg-white border rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all">
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-lg flex-shrink-0 ${colorClass}`}><Icon size={22} /></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{resource.name}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{TYPE_LABELS[resource.type]}</p>
                        </div>
                      </div>
                      {resource.description && <p className="text-sm text-gray-600 mt-3 line-clamp-2">{resource.description}</p>}
                      {resource.tags && resource.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {resource.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{tag}</span>
                          ))}
                          {resource.tags.length > 3 && <span className="px-2 py-0.5 text-gray-400 text-xs">+{resource.tags.length - 3}</span>}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Eye size={12} /> {resource.viewCount || 0}</span>
                          <span className="flex items-center gap-1"><Download size={12} /> {resource.downloadCount || 0}</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleViewResource(resource)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded" title="Mở"><ExternalLink size={14} /></button>
                          <button onClick={() => openEditResource(resource)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Sửa"><Edit size={14} /></button>
                          <button onClick={() => handleDeleteResource(resource)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Xóa"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div key={resource.id} className="bg-white border rounded-lg p-3 flex items-center gap-3 hover:shadow-sm hover:border-indigo-200 transition-all">
                      <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}><Icon size={18} /></div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{resource.name}</h4>
                        <p className="text-xs text-gray-500">{TYPE_LABELS[resource.type]}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><Eye size={12} /> {resource.viewCount || 0}</span>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => handleViewResource(resource)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded"><ExternalLink size={14} /></button>
                        <button onClick={() => openEditResource(resource)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteResource(resource)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}


      {/* Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editingFolder ? 'Sửa thư mục' : 'Tạo thư mục mới'}</h3>
              <button onClick={() => setShowFolderModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên thư mục *</label>
                <input
                  type="text"
                  value={folderForm.name}
                  onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập tên thư mục"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={folderForm.description}
                  onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Mô tả thư mục (tùy chọn)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Màu sắc</label>
                <div className="flex flex-wrap gap-2">
                  {FOLDER_COLORS.map(color => (
                    <button
                      key={color}
                      onClick={() => setFolderForm({ ...folderForm, color })}
                      className={`w-8 h-8 rounded-lg transition-transform ${folderForm.color === color ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-2">Xem trước:</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${folderForm.color}20` }}>
                    <Folder size={24} style={{ color: folderForm.color }} />
                  </div>
                  <span className="font-medium text-gray-900">{folderForm.name || 'Tên thư mục'}</span>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50 rounded-b-xl">
              <button onClick={() => setShowFolderModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Hủy</button>
              <button onClick={handleSaveFolder} disabled={!folderForm.name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {editingFolder ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResourceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">{editingResource ? 'Sửa tài nguyên' : 'Thêm tài nguyên'}</h3>
              <button onClick={() => setShowResourceModal(false)} className="p-1 hover:bg-gray-100 rounded"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên tài nguyên *</label>
                <input
                  type="text"
                  value={resourceForm.name}
                  onChange={(e) => setResourceForm({ ...resourceForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Nhập tên tài nguyên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại *</label>
                <div className="grid grid-cols-5 gap-2">
                  {(Object.keys(TYPE_ICONS) as ResourceType[]).map(type => {
                    const Icon = TYPE_ICONS[type];
                    const isSelected = resourceForm.type === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setResourceForm({ ...resourceForm, type })}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <Icon size={20} className={isSelected ? 'text-indigo-600' : 'text-gray-500'} />
                        <span className={`text-xs ${isSelected ? 'text-indigo-600 font-medium' : 'text-gray-500'}`}>{TYPE_LABELS[type]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link</label>
                <input
                  type="url"
                  value={resourceForm.url || ''}
                  onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={resourceForm.description || ''}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  placeholder="Mô tả tài nguyên"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Nhập tag và Enter"
                  />
                  <button onClick={addTag} className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"><Plus size={18} /></button>
                </div>
                {resourceForm.tags && resourceForm.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {resourceForm.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-indigo-900"><X size={14} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t bg-gray-50">
              <button onClick={() => setShowResourceModal(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg">Hủy</button>
              <button onClick={handleSaveResource} disabled={!resourceForm.name} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                {editingResource ? 'Cập nhật' : 'Thêm mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
