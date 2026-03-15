import React, { useState } from 'react';
import { useProperties } from '../../hooks/useProperties';
import { usePropertyPortals } from '../../hooks/usePropertyPortals';
import PropertyFormModal from './PropertyFormModal';
import PortalsTab from './portals/PortalsTab';
import {
  Home, Plus, Search, List, LayoutGrid, ChevronDown,
  Edit2, Copy, Trash2, BedDouble, Bath, Car, Maximize,
  Star, Tag, Loader2, Upload, Eye, Building2,
  ArrowUpDown, Filter, X, Image as ImageIcon, MapPin,
  Globe, CheckCircle2, AlertCircle, XCircle,
} from 'lucide-react';

const formatBRL = (v) => {
  if (!v && v !== 0) return '—';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
};

const STATUS_COLORS = {
  'Disponível': 'bg-green-50 text-green-700 border-green-200',
  'Reservado': 'bg-amber-50 text-amber-700 border-amber-200',
  'Vendido': 'bg-blue-50 text-blue-700 border-blue-200',
  'Alugado': 'bg-purple-50 text-purple-700 border-purple-200',
  'Indisponível': 'bg-gray-100 text-gray-500 border-gray-200',
};

const PORTAL_COLORS = {
  zap: '#0077B6',
  vivareal: '#00A651',
  olx: '#6E0AD6',
  imovelweb: '#FF6B00',
};

const PORTAL_LABELS = { zap: 'ZAP', vivareal: 'Viva', olx: 'OLX', imovelweb: 'Imov' };

const TYPES = ['Casa', 'Apartamento', 'Terreno', 'Sobrado', 'Chácara', 'Cobertura', 'Studio', 'Sala Comercial'];
const STATUSES = ['Disponível', 'Reservado', 'Vendido', 'Alugado', 'Indisponível'];
const SORT_OPTIONS = [
  { value: 'created_at_desc', label: 'Mais recente' },
  { value: 'created_at_asc', label: 'Mais antigo' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'title_asc', label: 'A-Z' },
];

// --- KPI Card ---
function KPICard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-[#E8E2D8] p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-[#1B2B3A]">{value}</p>
        <p className="text-xs text-[#8A8A8A]">{label}</p>
      </div>
    </div>
  );
}

// --- Portal Dots ---
function PortalDots({ propertyId, getPortalStatusForProperty }) {
  const status = getPortalStatusForProperty(propertyId);
  return (
    <div className="flex gap-1">
      {['zap', 'vivareal', 'olx', 'imovelweb'].map(p => {
        const pp = status[p];
        const published = pp?.is_published;
        return (
          <div key={p} title={`${PORTAL_LABELS[p]}: ${published ? 'Publicado' : 'Não publicado'}`}
            className="w-2 h-2 rounded-full" style={{ backgroundColor: published ? PORTAL_COLORS[p] : '#d1d5db' }} />
        );
      })}
    </div>
  );
}

// --- Property List Item ---
function PropertyListItem({ property, onEdit, onDuplicate, onDelete, getPortalStatusForProperty }) {
  const [showActions, setShowActions] = useState(false);
  const img = property.images?.[0];
  return (
    <div className="bg-white rounded-xl border border-[#E8E2D8] p-3 flex gap-3 items-center hover:shadow-md transition-all group">
      <div className="w-20 h-[60px] rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
        {img ? <img src={img} alt="" className="w-full h-full object-cover" /> :
          <div className="w-full h-full flex items-center justify-center"><Home className="w-5 h-5 text-gray-300" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-[#1B2B3A] truncate">{property.title}</h3>
          {property.is_featured && <span className="text-xs bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">Destaque</span>}
          {property.is_launch && <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">Lançamento</span>}
          {property.badge && !property.is_featured && !property.is_launch && (
            <span className="text-xs bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">{property.badge}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-[#8A8A8A]">
          {property.neighborhood && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{property.neighborhood}</span>}
          {property.bedrooms > 0 && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{property.bedrooms}</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{property.bathrooms}</span>}
          {property.garage > 0 && <span className="flex items-center gap-0.5"><Car className="w-3 h-3" />{property.garage}</span>}
          {property.area > 0 && <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{property.area}m²</span>}
        </div>
      </div>
      <div className="flex-shrink-0 text-right flex items-center gap-3">
        <PortalDots propertyId={property.id} getPortalStatusForProperty={getPortalStatusForProperty} />
        <span className={`text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[property.status] || STATUS_COLORS['Indisponível']}`}>
          {property.status}
        </span>
        <p className="text-sm font-medium text-[#C4A265] min-w-[100px] text-right">{formatBRL(property.price)}</p>
        <div className="relative">
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => onEdit(property)} className="p-1.5 hover:bg-slate-100 rounded-lg" title="Editar">
              <Edit2 className="w-4 h-4 text-[#8A8A8A]" />
            </button>
            <button onClick={() => onDuplicate(property)} className="p-1.5 hover:bg-slate-100 rounded-lg" title="Duplicar">
              <Copy className="w-4 h-4 text-[#8A8A8A]" />
            </button>
            <button onClick={() => onDelete(property)} className="p-1.5 hover:bg-red-50 rounded-lg" title="Excluir">
              <Trash2 className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Property Grid Card ---
function PropertyGridCard({ property, onEdit, onDuplicate, onDelete }) {
  const img = property.images?.[0];
  return (
    <div className="bg-white rounded-xl border border-[#E8E2D8] overflow-hidden hover:shadow-lg transition-all group flex flex-col">
      <div className="aspect-[16/10] bg-slate-100 relative overflow-hidden">
        {img ? <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> :
          <div className="w-full h-full flex items-center justify-center"><Home className="w-10 h-10 text-gray-200" /></div>}
        <span className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full border ${STATUS_COLORS[property.status] || STATUS_COLORS['Indisponível']}`}>
          {property.status}
        </span>
        {property.is_featured && <span className="absolute top-2 left-2 text-xs bg-amber-500 text-white px-2 py-1 rounded-full">Destaque</span>}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button onClick={() => onEdit(property)} className="p-2 bg-white rounded-full shadow hover:bg-gray-50"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => onDuplicate(property)} className="p-2 bg-white rounded-full shadow hover:bg-gray-50"><Copy className="w-4 h-4" /></button>
          <button onClick={() => onDelete(property)} className="p-2 bg-white rounded-full shadow hover:bg-red-50"><Trash2 className="w-4 h-4 text-red-500" /></button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-medium text-[#1B2B3A] line-clamp-2 text-sm">{property.title}</h3>
        {property.neighborhood && <p className="text-xs text-[#8A8A8A] mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{property.neighborhood}</p>}
        <p className="text-[#C4A265] font-bold text-lg mt-2">{formatBRL(property.price)}</p>
        <div className="flex gap-3 mt-2 text-xs text-[#8A8A8A]">
          {property.bedrooms > 0 && <span className="flex items-center gap-0.5"><BedDouble className="w-3 h-3" />{property.bedrooms}</span>}
          {property.bathrooms > 0 && <span className="flex items-center gap-0.5"><Bath className="w-3 h-3" />{property.bathrooms}</span>}
          {property.garage > 0 && <span className="flex items-center gap-0.5"><Car className="w-3 h-3" />{property.garage}</span>}
          {property.area > 0 && <span className="flex items-center gap-0.5"><Maximize className="w-3 h-3" />{property.area}m²</span>}
        </div>
      </div>
    </div>
  );
}

// --- CSV Import ---
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const hdr = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/"/g, ''));
    const obj = {};
    hdr.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  });
}

// --- Main Component ---
export default function AdminImoveis({ session }) {
  const {
    filtered, isLoading, kpis, filters, setFilters,
    createProperty, updateProperty, deleteProperty, duplicateProperty, reload,
  } = useProperties(session);

  const portalHook = usePropertyPortals(session);

  const [activeTab, setActiveTab] = useState('imoveis');
  const [viewMode, setViewMode] = useState('list');
  const [formModal, setFormModal] = useState({ open: false, property: null });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteProperty(deleteConfirm.id);
    setDeleteConfirm(null);
  };

  const handleDuplicate = async (prop) => {
    await duplicateProperty(prop);
  };

  const handleCSVImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const rows = parseCSV(ev.target.result);
      for (const row of rows) {
        await createProperty({
          title: row.title || row.titulo || '',
          type: row.type || row.tipo || 'Casa',
          modality: row.modality || row.modalidade || 'Venda',
          price: Number(row.price || row.preco || 0),
          neighborhood: row.neighborhood || row.bairro || '',
          city: row.city || row.cidade || 'Ubatuba',
          bedrooms: Number(row.bedrooms || row.quartos || 0),
          bathrooms: Number(row.bathrooms || row.banheiros || 0),
          garage: Number(row.garage || row.vagas || 0),
          area: Number(row.area || 0),
          status: 'Disponível',
        });
      }
      reload();
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#C4A265]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-xl border border-[#E8E2D8] p-1 w-fit">
        <button onClick={() => setActiveTab('imoveis')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'imoveis' ? 'bg-[#1B2B3A] text-white' : 'text-[#8A8A8A] hover:text-[#1B2B3A]'}`}>
          Meus Imóveis
        </button>
        <button onClick={() => setActiveTab('portais')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'portais' ? 'bg-[#1B2B3A] text-white' : 'text-[#8A8A8A] hover:text-[#1B2B3A]'}`}>
          <Globe className="w-4 h-4 inline mr-1" />Portais
        </button>
      </div>

      {activeTab === 'imoveis' && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Total de imóveis" value={kpis.total} icon={Home} color="bg-[#1B2B3A]/10 text-[#1B2B3A]" />
            <KPICard label="À venda" value={kpis.aVenda} icon={Tag} color="bg-green-50 text-green-700" />
            <KPICard label="Para aluguel" value={kpis.aluguel} icon={Building2} color="bg-blue-50 text-blue-700" />
            <KPICard label="Vendidos/Alugados" value={kpis.vendidos} icon={CheckCircle2} color="bg-purple-50 text-purple-700" />
          </div>

          {/* Actions Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input type="text" placeholder="Buscar por título, bairro ou endereço..."
                value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E2D8] text-sm focus:outline-none focus:border-[#C4A265]" />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-2.5 rounded-xl border text-sm flex items-center gap-1.5 ${showFilters ? 'bg-[#1B2B3A] text-white border-[#1B2B3A]' : 'border-[#E8E2D8] text-[#8A8A8A] hover:border-[#C4A265]'}`}>
              <Filter className="w-4 h-4" />Filtros
            </button>
            <div className="flex gap-1 border border-[#E8E2D8] rounded-xl p-0.5">
              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[#1B2B3A] text-white' : 'text-[#8A8A8A]'}`}>
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[#1B2B3A] text-white' : 'text-[#8A8A8A]'}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <select value={filters.sortBy} onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
              className="px-3 py-2.5 rounded-xl border border-[#E8E2D8] text-sm text-[#1B2B3A] focus:outline-none focus:border-[#C4A265]">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <label className="px-3 py-2.5 rounded-xl border border-[#E8E2D8] text-sm text-[#8A8A8A] hover:border-[#C4A265] cursor-pointer flex items-center gap-1.5">
              <Upload className="w-4 h-4" />Importar CSV
              <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
            </label>
            <button onClick={() => setFormModal({ open: true, property: null })}
              className="px-4 py-2.5 bg-[#C4A265] text-white rounded-xl text-sm font-medium hover:bg-[#b89355] flex items-center gap-1.5 shadow-sm">
              <Plus className="w-4 h-4" />Novo Imóvel
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="bg-white rounded-xl border border-[#E8E2D8] p-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="text-xs text-[#8A8A8A] mb-1 block">Tipo</label>
                <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-[#E8E2D8] text-sm focus:outline-none focus:border-[#C4A265]">
                  <option value="">Todos</option>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8A8A8A] mb-1 block">Status</label>
                <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-[#E8E2D8] text-sm focus:outline-none focus:border-[#C4A265]">
                  <option value="">Todos</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8A8A8A] mb-1 block">Modalidade</label>
                <select value={filters.modality} onChange={e => setFilters(f => ({ ...f, modality: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-[#E8E2D8] text-sm focus:outline-none focus:border-[#C4A265]">
                  <option value="">Todos</option>
                  <option value="Venda">Venda</option>
                  <option value="Aluguel">Aluguel</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-[#8A8A8A] mb-1 block">Preço mín.</label>
                <input type="number" placeholder="0" value={filters.priceMin}
                  onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-[#E8E2D8] text-sm w-28 focus:outline-none focus:border-[#C4A265]" />
              </div>
              <div>
                <label className="text-xs text-[#8A8A8A] mb-1 block">Preço máx.</label>
                <input type="number" placeholder="∞" value={filters.priceMax}
                  onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value }))}
                  className="px-3 py-2 rounded-lg border border-[#E8E2D8] text-sm w-28 focus:outline-none focus:border-[#C4A265]" />
              </div>
              <button onClick={() => setFilters({ search: '', type: '', status: '', modality: '', priceMin: '', priceMax: '', sortBy: 'created_at_desc' })}
                className="px-3 py-2 text-sm text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1">
                <X className="w-3 h-3" />Limpar
              </button>
            </div>
          )}

          {/* Property List/Grid */}
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E8E2D8] p-12 text-center">
              <Home className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-[#8A8A8A] text-sm">Nenhum imóvel encontrado.</p>
              <button onClick={() => setFormModal({ open: true, property: null })}
                className="mt-3 px-4 py-2 bg-[#C4A265] text-white rounded-lg text-sm hover:bg-[#b89355]">
                <Plus className="w-4 h-4 inline mr-1" />Adicionar primeiro imóvel
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-2">
              {filtered.map(p => (
                <PropertyListItem key={p.id} property={p}
                  onEdit={(prop) => setFormModal({ open: true, property: prop })}
                  onDuplicate={handleDuplicate}
                  onDelete={setDeleteConfirm}
                  getPortalStatusForProperty={portalHook.getPortalStatusForProperty} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map(p => (
                <PropertyGridCard key={p.id} property={p}
                  onEdit={(prop) => setFormModal({ open: true, property: prop })}
                  onDuplicate={handleDuplicate}
                  onDelete={setDeleteConfirm} />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'portais' && (
        <PortalsTab session={session} portalHook={portalHook} properties={filtered} reload={reload} />
      )}

      {/* Form Modal */}
      {formModal.open && (
        <PropertyFormModal
          property={formModal.property}
          onClose={() => setFormModal({ open: false, property: null })}
          onCreate={createProperty}
          onUpdate={updateProperty}
          onDelete={deleteProperty}
          reload={reload}
        />
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-[#1B2B3A]">Excluir imóvel</h3>
                <p className="text-sm text-[#8A8A8A]">Essa ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-[#1B2B3A] mb-4">Tem certeza que deseja excluir <strong>{deleteConfirm.title}</strong>?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-[#8A8A8A] hover:bg-gray-50 rounded-lg">Cancelar</button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
