/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  getFilteredRowModel,
  VisibilityState,
} from '@tanstack/react-table';
import {
  Search,
  ChevronDown,
  Copy,
  Check,
  Zap,
  Globe,
  Database,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Filter,
  Columns,
  ExternalLink,
  Cpu,
  Eye,
  Type,
  Code,
  Image as ImageIcon,
  Brain,
  Video,
  Layers,
  SearchIcon,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

/** Utility for tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---

type ModelCapability = 'text' | 'image' | 'code' | 'reasoning' | 'vision' | 'toolUse' | 'video' | 'search';

interface Pricing {
  input: number;      // per 1M tokens
  output: number;     // per 1M tokens
  cache?: number;     // per 1M tokens (read/write)
}

interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: string; // e.g. "1M"
  latency: number;       // seconds
  throughput: number;    // tps
  pricing: Pricing;
  webSearchCost?: string; // e.g. "+$10/K"
  perQueryCost?: string;
  capabilities: ModelCapability[];
  providersCount: number;
  zdr: boolean;         // Zero Data Retention
  noTraining: boolean;
  releasedAt: string;    // MM/DD/YYYY
  type: 'Text' | 'Code' | 'Image' | 'Video' | 'Embed' | 'Rerank';
}

// --- Mock Data ---

const SEED_MODELS: AIModel[] = [
  {
    id: 'openai-gpt-5.5',
    name: 'gpt-5.5',
    provider: 'openai',
    contextWindow: '1M',
    latency: 0.8,
    throughput: 120,
    pricing: { input: 0.5, output: 1.5, cache: 0.25 },
    webSearchCost: '+$5/K',
    capabilities: ['text', 'code', 'vision', 'toolUse', 'reasoning', 'search'],
    providersCount: 1,
    zdr: true,
    noTraining: true,
    releasedAt: '03/15/2026',
    type: 'Text',
  },
  {
    id: 'anthropic-claude-4.7-opus',
    name: 'claude-opus-4.7',
    provider: 'anthropic',
    contextWindow: '256K',
    latency: 1.2,
    throughput: 85,
    pricing: { input: 1.0, output: 3.0 },
    capabilities: ['text', 'code', 'vision', 'toolUse', 'reasoning'],
    providersCount: 3,
    zdr: true,
    noTraining: true,
    releasedAt: '04/01/2026',
    type: 'Text',
  },
  {
    id: 'deepseek-v4-pro',
    name: 'deepseek-v4-pro',
    provider: 'deepseek',
    contextWindow: '128K',
    latency: 0.4,
    throughput: 160,
    pricing: { input: 0.05, output: 0.15 },
    capabilities: ['text', 'code', 'reasoning'],
    providersCount: 5,
    zdr: false,
    noTraining: true,
    releasedAt: '02/10/2026',
    type: 'Text',
  },
  {
    id: 'google-gemini-3.5-pro',
    name: 'gemini-3.5-pro',
    provider: 'google',
    contextWindow: '2M',
    latency: 0.9,
    throughput: 95,
    pricing: { input: 0.35, output: 1.05, cache: 0.17 },
    webSearchCost: 'Included',
    capabilities: ['text', 'code', 'vision', 'video', 'toolUse', 'search'],
    providersCount: 1,
    zdr: true,
    noTraining: true,
    releasedAt: '01/20/2026',
    type: 'Text',
  },
  {
    id: 'xai-grok-4.3',
    name: 'grok-4.3',
    provider: 'xai',
    contextWindow: '1M',
    latency: 0.6,
    throughput: 140,
    pricing: { input: 0.4, output: 1.2 },
    webSearchCost: 'Realtime',
    capabilities: ['text', 'code', 'search', 'reasoning'],
    providersCount: 1,
    zdr: false,
    noTraining: false,
    releasedAt: '03/01/2026',
    type: 'Text',
  },
  {
    id: 'alibaba-qwen-3.6-72b',
    name: 'qwen3.6-72b',
    provider: 'alibaba',
    contextWindow: '128K',
    latency: 0.5,
    throughput: 110,
    pricing: { input: 0.1, output: 0.3 },
    capabilities: ['text', 'code', 'vision'],
    providersCount: 8,
    zdr: false,
    noTraining: true,
    releasedAt: '12/15/2025',
    type: 'Text',
  },
  {
    id: 'mistral-large-3',
    name: 'mistral-large-3',
    provider: 'mistral',
    contextWindow: '128K',
    latency: 0.7,
    throughput: 100,
    pricing: { input: 0.2, output: 0.6 },
    capabilities: ['text', 'code', 'toolUse'],
    providersCount: 6,
    zdr: true,
    noTraining: true,
    releasedAt: '11/30/2025',
    type: 'Text',
  },
  {
    id: 'meta-llama-4-70b',
    name: 'llama-4-70b',
    provider: 'meta',
    contextWindow: '128K',
    latency: 0.35,
    throughput: 180,
    pricing: { input: 0.0, output: 0.0 }, // Open weights
    capabilities: ['text', 'code', 'reasoning'],
    providersCount: 12,
    zdr: true,
    noTraining: true,
    releasedAt: '03/10/2026',
    type: 'Text',
  },
  {
    id: 'cohere-command-r-plus',
    name: 'command-r-plus',
    provider: 'cohere',
    contextWindow: '128K',
    latency: 0.65,
    throughput: 110,
    pricing: { input: 0.3, output: 1.0 },
    capabilities: ['text', 'toolUse', 'search'],
    providersCount: 4,
    zdr: true,
    noTraining: true,
    releasedAt: '03/20/2026',
    type: 'Text',
  },
  {
    id: 'bytedance-doubao-pro',
    name: 'doubao-pro',
    provider: 'bytedance',
    contextWindow: '128K',
    latency: 0.4,
    throughput: 150,
    pricing: { input: 0.06, output: 0.12 },
    capabilities: ['text', 'vision', 'toolUse'],
    providersCount: 1,
    zdr: false,
    noTraining: true,
    releasedAt: '04/10/2026',
    type: 'Text',
  },
  {
    id: 'zhipu-glm-4',
    name: 'glm-4',
    provider: 'zhipu',
    contextWindow: '128K',
    latency: 0.55,
    throughput: 120,
    pricing: { input: 0.15, output: 0.45 },
    capabilities: ['text', 'code', 'reasoning', 'vision'],
    providersCount: 1,
    zdr: false,
    noTraining: true,
    releasedAt: '01/05/2026',
    type: 'Text',
  },
  {
    id: 'minimax-abab6.5',
    name: 'abab6.5',
    provider: 'minimax',
    contextWindow: '128K',
    latency: 0.6,
    throughput: 105,
    pricing: { input: 0.2, output: 0.6 },
    capabilities: ['text', 'vision'],
    providersCount: 1,
    zdr: false,
    noTraining: true,
    releasedAt: '02/15/2026',
    type: 'Text',
  },
  {
    id: 'openai-gpt-image-2',
    name: 'gpt-image-2',
    provider: 'openai',
    contextWindow: 'N/A',
    latency: 2.5,
    throughput: 0,
    pricing: { input: 0.04, output: 0.08 }, // Per image
    capabilities: ['image'],
    providersCount: 1,
    zdr: true,
    noTraining: true,
    releasedAt: '02/28/2026',
    type: 'Image',
  },
  {
    id: 'moonshot-kimi-k2.6',
    name: 'kimi-k2.6',
    provider: 'moonshotai',
    contextWindow: '2M',
    latency: 1.1,
    throughput: 70,
    pricing: { input: 0.3, output: 0.9 },
    capabilities: ['text', 'search', 'toolUse'],
    providersCount: 1,
    zdr: false,
    noTraining: true,
    releasedAt: '04/05/2026',
    type: 'Text',
  },
  {
    id: 'xiaomi-mimo-v2.5-pro',
    name: 'mimo-v2.5-pro',
    provider: 'xiaomi',
    contextWindow: '64K',
    latency: 0.45,
    throughput: 130,
    pricing: { input: 0.08, output: 0.24 },
    capabilities: ['text', 'vision', 'toolUse'],
    providersCount: 1,
    zdr: true,
    noTraining: true,
    releasedAt: '01/15/2026',
    type: 'Text',
  },
];

// Replicate data to reach 40+ models
const GENERATED_MODELS: AIModel[] = Array.from({ length: 45 }).map((_, i) => {
  const base = SEED_MODELS[i % SEED_MODELS.length];
  const suffix = i > SEED_MODELS.length ? `-${Math.floor(i / 10)}` : '';
  return {
    ...base,
    id: `${base.id}${suffix}`,
    name: `${base.name}${suffix}`,
    latency: Math.max(0.1, base.latency + (Math.random() - 0.5) * 0.2),
    throughput: Math.floor(base.throughput + (Math.random() - 0.5) * 30),
  };
});

// --- Components ---

const CapabilityIcon = ({ type }: { type: ModelCapability }) => {
  switch (type) {
    case 'text': return <Type className="w-3 h-3" />;
    case 'image': return <ImageIcon className="w-3 h-3" />;
    case 'code': return <Code className="w-3 h-3" />;
    case 'reasoning': return <Brain className="w-3 h-3" />;
    case 'vision': return <Eye className="w-3 h-3" />;
    case 'toolUse': return <Layers className="w-3 h-3" />;
    case 'video': return <Video className="w-3 h-3" />;
    case 'search': return <SearchIcon className="w-3 h-3" />;
  }
};

const ProviderIcon = ({ provider }: { provider: string }) => {
  // Stylized terminal-like provider icons
  return (
    <div className="w-5 h-5 flex items-center justify-center bg-[#1a1a1a] border border-[#2a2a2a] overflow-hidden">
      <span className="text-[10px] font-bold uppercase text-white/80">
        {provider.charAt(0)}
      </span>
    </div>
  );
};

export default function App() {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'releasedAt', desc: true }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [activeProvider, setActiveProvider] = useState('All Providers');
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredData = useMemo(() => {
    return GENERATED_MODELS.filter((m) => {
      const matchesTab = activeTab === 'All' || m.type === activeTab;
      const matchesProvider = activeProvider === 'All Providers' || m.provider.toLowerCase() === activeProvider.toLowerCase();
      return matchesTab && matchesProvider;
    });
  }, [activeTab, activeProvider]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const columns: ColumnDef<AIModel>[] = [
    {
      accessorKey: 'name',
      header: 'Model',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 group min-w-[180px]">
          <ProviderIcon provider={row.original.provider} />
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] text-muted-foreground uppercase font-mono">{row.original.provider}</span>
            <span className="text-[13px] text-white/90 font-medium">{row.original.name}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(row.original.name, row.original.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10"
          >
            {copiedId === row.original.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-white/40" />}
          </button>
        </div>
      ),
    },
    {
      accessorKey: 'contextWindow',
      header: 'Context',
      cell: ({ getValue }) => <span className="font-mono text-[12px]">{getValue() as string}</span>,
    },
    {
      accessorKey: 'latency',
      header: 'Latency',
      cell: ({ getValue }) => <span className="font-mono text-[12px] text-orange-400">{(getValue() as number).toFixed(1)}s</span>,
    },
    {
      accessorKey: 'throughput',
      header: 'Throughput',
      cell: ({ getValue }) => <span className="font-mono text-[12px] text-blue-400">{(getValue() as number)} tps</span>,
    },
    {
      id: 'input',
      header: 'Input',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-mono">${row.original.pricing.input}</span>
          <span className="text-[9px] text-muted-foreground">/M tokens</span>
        </div>
      ),
    },
    {
      id: 'output',
      header: 'Output',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-[12px] font-mono">${row.original.pricing.output}</span>
          <span className="text-[9px] text-muted-foreground">/M tokens</span>
        </div>
      ),
    },
    {
      id: 'cache',
      header: 'Cache',
      cell: ({ row }) => (
        <div className="flex flex-col">
          {row.original.pricing.cache ? (
            <>
              <span className="text-[12px] font-mono">${row.original.pricing.cache}</span>
              <span className="text-[9px] text-muted-foreground">Read: $0.2/M</span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'webSearchCost',
      header: 'Web Search',
      cell: ({ getValue }) => <span className="text-[11px] text-muted-foreground uppercase">{getValue() as string || "—"}</span>,
    },
    {
      accessorKey: 'perQueryCost',
      header: 'Per Query',
      cell: ({ getValue }) => <span className="text-[11px] text-muted-foreground">{(getValue() as string) || "—"}</span>,
    },
    {
      accessorKey: 'capabilities',
      header: 'Capabilities',
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.capabilities.map((c) => (
            <div key={c} title={c} className="p-1 border border-[#1a1a1a] bg-[#0c0c0c] text-white/60">
              <CapabilityIcon type={c} />
            </div>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'providersCount',
      header: 'Providers',
      cell: ({ getValue }) => (
        <div className="flex -space-x-1">
          {Array.from({ length: Math.min(3, getValue() as number) }).map((_, i) => (
            <div key={i} className="w-5 h-5 rounded-full bg-[#1a1a1a] border border-[#050505] flex items-center justify-center text-[8px]">
              {i === 2 ? `+${(getValue() as number) - 2}` : ''}
            </div>
          ))}
        </div>
      ),
    },
    {
      accessorKey: 'zdr',
      header: 'ZDR',
      cell: ({ getValue }) => (getValue() ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <span className="text-muted-foreground">—</span>),
    },
    {
      accessorKey: 'noTraining',
      header: 'No Training',
      cell: ({ getValue }) => (getValue() ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <span className="text-muted-foreground">—</span>),
    },
    {
      accessorKey: 'releasedAt',
      header: 'Released',
      cell: ({ getValue }) => <span className="text-[11px] font-mono text-muted-foreground">{getValue() as string}</span>,
      sortingFn: (rowA, rowB, columnId) => {
        const dateA = new Date(rowA.getValue(columnId) as string).getTime();
        const dateB = new Date(rowB.getValue(columnId) as string).getTime();
        return dateA - dateB;
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const providersList = Array.from(new Set(GENERATED_MODELS.map((m) => m.provider.charAt(0).toUpperCase() + m.provider.slice(1))));

  return (
    <div className="min-h-screen bg-[#050505] text-[#a1a1aa] flex flex-col font-sans selection:bg-white/20 selection:text-white">
      {/* --- Top Navigation / Search --- */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-[#1a1a1a] bg-[#050505] z-40 sticky top-0">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#525252]" />
            <input 
              type="text" 
              placeholder="Search model..." 
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full bg-[#111] border border-[#1a1a1a] rounded px-9 py-1.5 text-xs text-white focus:outline-none focus:border-[#404040] placeholder-[#525252]" 
            />
          </div>
          <div className="flex gap-1">
            {['All', 'Text', 'Code', 'Image', 'Video', 'Embed', 'Rerank'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3 py-1.5 text-[11px] rounded transition-all font-medium",
                  activeTab === tab 
                    ? "bg-[#1a1a1a] text-white" 
                    : "text-[#a1a1aa] hover:bg-[#111]"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-[#1a1a1a] text-[11px] rounded text-white group hover:border-[#404040] cursor-pointer focus:outline-none">
              {activeProvider} <ChevronDown className="w-3 h-3 text-[#525252] group-hover:text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0c0c0c] border-[#1a1a1a] text-white min-w-[160px]">
              <DropdownMenuItem onClick={() => setActiveProvider('All Providers')} className="focus:bg-white/5 cursor-pointer">All Providers</DropdownMenuItem>
              {providersList.map((p) => (
                <DropdownMenuItem key={p} onClick={() => setActiveProvider(p)} className="focus:bg-white/5 cursor-pointer">{p}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-[#1a1a1a] text-[11px] rounded text-white group hover:border-[#404040] cursor-pointer focus:outline-none">
              Sort by Release Date <ChevronDown className="w-3 h-3 text-[#525252] group-hover:text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0c0c0c] border-[#1a1a1a] text-white">
              <DropdownMenuItem onClick={() => setSorting([{ id: 'releasedAt', desc: true }])} className="focus:bg-white/5 cursor-pointer">Latest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSorting([{ id: 'latency', desc: false }])} className="focus:bg-white/5 cursor-pointer">Low Latency</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSorting([{ id: 'throughput', desc: true }])} className="focus:bg-white/5 cursor-pointer">High Throughput</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 bg-[#111] border border-[#1a1a1a] text-[11px] rounded text-white group hover:border-[#404040] cursor-pointer focus:outline-none">
              Columns ({table.getVisibleFlatColumns().length}) <ChevronDown className="w-3 h-3 text-[#525252] group-hover:text-white" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#0c0c0c] border-[#1a1a1a] text-white">
              {table.getAllColumns().map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize focus:bg-white/5"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* --- Main Content: Table Viewport --- */}
      <main className="flex-1 overflow-x-auto overflow-y-auto bg-[#050505] relative custom-scrollbar">
        <Table className="w-full text-left border-collapse border-y border-[#1a1a1a]">
          <TableHeader className="sticky top-0 bg-[#050505] z-30 shadow-[0_1px_0_0_#1a1a1a]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="h-9 hover:bg-transparent border-[#1a1a1a]">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 text-[10px] uppercase font-mono tracking-wider font-bold border-r border-[#1a1a1a] last:border-r-0 text-[#525252]"
                  >
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        header.column.getCanSort() ? "cursor-pointer select-none hover:text-white transition-colors" : ""
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getCanSort() && <ArrowUpDown className="w-2.5 h-2.5 opacity-40 shrink-0" />}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-[#1a1a1a]">
            {table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => setSelectedModel(row.original)}
                className="h-[44px] hover:bg-[#0a0a0a] cursor-pointer group bg-[#111]/10 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className="py-0 px-4 border-r border-[#1a1a1a] last:border-r-0 whitespace-nowrap h-[44px]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.getRowModel().rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center text-[#525252] italic font-mono text-xs">
                  NO_MATCHES_FOUND
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </main>

      {/* --- Side Drawer --- */}
      <Sheet open={!!selectedModel} onOpenChange={() => setSelectedModel(null)}>
        <SheetContent side="right" className="w-[380px] border-l border-[#1a1a1a] bg-[#0a0a0a] text-white p-0 overflow-hidden flex flex-col z-50 shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
          {selectedModel && (
            <>
              <div className="p-5 border-b border-[#1a1a1a] flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-mono text-[#525252] mb-1 uppercase tracking-widest">Selected Model</div>
                  <h2 className="text-xl text-white font-bold leading-tight">{selectedModel.name}</h2>
                  <p className="text-xs text-[#737373]">by {selectedModel.provider}</p>
                </div>
                <button 
                  onClick={() => setSelectedModel(null)}
                  className="text-[#525252] hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-5 space-y-6">
                  <section>
                    <h3 className="text-[10px] font-mono text-[#525252] mb-3 uppercase tracking-widest">Pricing Summary</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#111] p-3 rounded border border-[#1a1a1a]">
                        <div className="text-[9px] text-[#525252] uppercase font-bold mb-1">Input</div>
                        <div className="text-sm text-white font-mono">${selectedModel.pricing.input}<span className="text-[10px] text-[#525252]"> /1M</span></div>
                      </div>
                      <div className="bg-[#111] p-3 rounded border border-[#1a1a1a]">
                        <div className="text-[9px] text-[#525252] uppercase font-bold mb-1">Output</div>
                        <div className="text-sm text-white font-mono">${selectedModel.pricing.output}<span className="text-[10px] text-[#525252]"> /1M</span></div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-mono text-[#525252] mb-3 uppercase tracking-widest">Technical Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] py-2 border-b border-[#1a1a1a]/50">
                        <span className="text-[#737373]">Context Window</span>
                        <span className="text-white font-mono">{selectedModel.contextWindow} tokens</span>
                      </div>
                      <div className="flex justify-between text-[11px] py-2 border-b border-[#1a1a1a]/50">
                        <span className="text-[#737373]">P50 Latency</span>
                        <span className="text-orange-400 font-mono">{selectedModel.latency}s</span>
                      </div>
                      <div className="flex justify-between text-[11px] py-2 border-b border-[#1a1a1a]/50">
                        <span className="text-[#737373]">Throughput</span>
                        <span className="text-blue-400 font-mono">{selectedModel.throughput} tps</span>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-mono text-[#525252] mb-3 uppercase tracking-widest">Capabilities</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedModel.capabilities.map((c) => (
                        <div key={c} className="flex items-center gap-2 px-3 py-2 bg-[#111] border border-[#1a1a1a] rounded">
                          <CapabilityIcon type={c} />
                          <span className="text-[11px] capitalize font-medium text-white/80">{c}</span>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section>
                    <h3 className="text-[10px] font-mono text-[#525252] mb-3 uppercase tracking-widest">API Endpoint</h3>
                    <div className="bg-black p-3 rounded border border-[#1a1a1a] font-mono text-[10px] text-[#737373] relative group">
                      <button 
                        onClick={() => copyToClipboard(selectedModel.id, 'id')}
                        className="absolute top-2 right-2 text-white/40 hover:text-white transition-colors bg-white/5 py-0.5 px-1 rounded"
                      >
                        COPY
                      </button>
                      <span className="text-blue-400">curl</span> https://api.modelbench.ai/v1/chat <br/>
                      -H <span className="text-green-400">"Authorization: Bearer $KEY"</span> <br/>
                      -d <span className="text-yellow-500">{`'{"model": "${selectedModel.id}"}'`}</span>
                    </div>
                  </section>
                </div>
              </ScrollArea>

              <div className="p-5 border-t border-[#1a1a1a] bg-[#111]">
                 <button className="w-full bg-white text-black font-bold py-3 rounded text-[11px] uppercase tracking-widest hover:bg-white/90 transition-colors flex items-center justify-center gap-2">
                   TRY MODEL IN PLAYGROUND <ExternalLink className="w-3.5 h-3.5" />
                 </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* --- Footer Status Bar --- */}
      <footer className="h-8 border-t border-[#1a1a1a] bg-[#050505] flex items-center justify-between px-4 text-[10px] font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-white/80 font-bold uppercase tracking-widest">45 Models Active</span>
          </span>
          <span className="text-[#525252] uppercase">Last Sync: 120ms ago</span>
        </div>
        <div className="flex gap-4">
          <button className="text-[#525252] hover:text-white transition-colors uppercase tracking-widest">API DOCS</button>
          <button className="text-[#525252] hover:text-white transition-colors uppercase tracking-widest">SYSTEM STATUS</button>
          <button className="text-[#525252] hover:text-white transition-colors uppercase tracking-widest">GITHUB</button>
        </div>
      </footer>
    </div>
  );
}
