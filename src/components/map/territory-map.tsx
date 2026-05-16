"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import MapGL, { Source, Layer, Marker, Popup, NavigationControl, type MapRef } from "react-map-gl/maplibre";
import type { MapMouseEvent } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Loader2, RefreshCw, Filter, MapPin, X, Sliders, Crosshair, Clock,
  ChevronDown, Phone, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GEM, CAVE } from "@/lib/cave-theme";
import { GemGrade } from "@/components/ui/gem-grade";
import type { MapResponse, MapLead, ZipCluster } from "@/app/api/leads/map/route";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/dark";

const DRIVE_INTERVALS = [15, 30, 45, 60, 75, 90, 105, 120] as const;
type DriveInterval = typeof DRIVE_INTERVALS[number];

const PROPERTY_TYPES = ["single_family", "multi_family", "condo", "townhouse", "land", "commercial"] as const;
const STAGES = ["new", "contacted", "qualified", "booked"] as const;
const GRADES = ["elite", "refined", "rock"] as const;

interface Filters {
  grades:        Set<"elite" | "refined" | "rock">;
  stages:        Set<"new" | "contacted" | "qualified" | "booked">;
  propertyTypes: Set<string>;
  absenteeOnly:  boolean;
  hasPhone:      boolean;
  hasEmail:      boolean;
  equityMin:     number;
  yearsMin:      number;
  scoreMin:      number;
  recencyDays:   number | null; // null = any
}

function makeDefaultFilters(): Filters {
  return {
    grades:        new Set(GRADES),
    stages:        new Set(STAGES),
    propertyTypes: new Set(PROPERTY_TYPES),
    absenteeOnly:  false,
    hasPhone:      false,
    hasEmail:      false,
    equityMin:     0,
    yearsMin:      0,
    scoreMin:      0,
    recencyDays:   null,
  };
}

const ORIGIN_STORAGE_KEY = "lm_map_origin_v1";

// ── Helpers ───────────────────────────────────────────────────────────────────

function gradeColor(g: ZipCluster["topGrade"]): string {
  if (g === "elite")   return GEM.green;
  if (g === "refined") return GEM.yellow;
  if (g === "rock")    return "#9ca3af";
  return "#525252";
}

function makeCirclePolygon(lng: number, lat: number, miles: number, points = 96): [number, number][] {
  const earthRadius = 3963;
  const dist = miles / earthRadius;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const coords: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const bearing = (i / points) * 2 * Math.PI;
    const newLat = Math.asin(
      Math.sin(latRad) * Math.cos(dist) +
      Math.cos(latRad) * Math.sin(dist) * Math.cos(bearing)
    );
    const newLng = lngRad + Math.atan2(
      Math.sin(bearing) * Math.sin(dist) * Math.cos(latRad),
      Math.cos(dist) - Math.sin(latRad) * Math.sin(newLat)
    );
    coords.push([(newLng * 180) / Math.PI, (newLat * 180) / Math.PI]);
  }
  return coords;
}

function minutesToMiles(minutes: number): number {
  return (minutes / 60) * 30; // 30 mph average
}

function passesFilters(lead: MapLead, f: Filters): boolean {
  if (lead.gem_grade !== "ungraded" && !f.grades.has(lead.gem_grade as "elite" | "refined" | "rock")) return false;
  if (lead.gem_grade === "ungraded" && f.grades.size < GRADES.length) return false;
  const stage = (lead.stage ?? "new") as "new" | "contacted" | "qualified" | "booked";
  if (!f.stages.has(stage)) return false;
  if (lead.property_type && !f.propertyTypes.has(lead.property_type)) return false;
  if (f.absenteeOnly && !lead.is_absentee_owner) return false;
  const phone = lead.phone ?? lead.enrichment_data?.phones?.[0];
  const email = lead.email ?? lead.enrichment_data?.emails?.[0];
  if (f.hasPhone && !phone) return false;
  if (f.hasEmail && !email) return false;
  if ((lead.equity_percent ?? 0) < f.equityMin) return false;
  if ((lead.years_owned ?? 0) < f.yearsMin) return false;
  if ((lead.opportunity_score ?? 0) < f.scoreMin) return false;
  if (f.recencyDays != null) {
    const ageDays = (Date.now() - new Date(lead.created_at).getTime()) / 86400000;
    if (ageDays > f.recencyDays) return false;
  }
  return true;
}

// ── Map page ──────────────────────────────────────────────────────────────────

export function TerritoryMap() {
  const mapRef = useRef<MapRef>(null);

  const [data, setData] = useState<MapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedZip, setSelectedZip] = useState<ZipCluster | null>(null);
  const [hoveredZip, setHoveredZip] = useState<ZipCluster | null>(null);

  const [filters, setFilters] = useState<Filters>(makeDefaultFilters);
  const [filterOpen, setFilterOpen] = useState(true);

  const [origin, setOrigin] = useState<{ lng: number; lat: number } | null>(null);
  const [settingOrigin, setSettingOrigin] = useState(false);
  const [activeIntervals, setActiveIntervals] = useState<Set<DriveInterval>>(new Set([15, 30, 60]));
  const [drivePanelOpen, setDrivePanelOpen] = useState(false);

  // Load origin from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(ORIGIN_STORAGE_KEY);
    if (saved) {
      try { setOrigin(JSON.parse(saved)); } catch {}
    }
  }, []);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/map");
      if (!res.ok) throw new Error("Failed to load map data");
      const json: MapResponse = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Filter clusters and leads based on active filters
  const { filteredClusters, filteredLeadsByZip } = useMemo(() => {
    if (!data) return { filteredClusters: [], filteredLeadsByZip: new Map<string, MapLead[]>() };
    const byZip = new Map<string, MapLead[]>();
    for (const lead of data.leads) {
      if (!passesFilters(lead, filters)) continue;
      const zip = lead.property_zip?.trim().slice(0, 5);
      if (!zip) continue;
      if (!byZip.has(zip)) byZip.set(zip, []);
      byZip.get(zip)!.push(lead);
    }
    const clusters = data.clusters
      .map(c => {
        const leads = byZip.get(c.zip) ?? [];
        if (leads.length === 0) return null;
        const elite   = leads.filter(l => l.gem_grade === "elite").length;
        const refined = leads.filter(l => l.gem_grade === "refined").length;
        const rock    = leads.filter(l => l.gem_grade === "rock").length;
        const avgScore = Math.round(leads.reduce((s, l) => s + l.opportunity_score, 0) / leads.length);
        const topGrade: ZipCluster["topGrade"] =
          elite > 0 ? "elite" : refined > 0 ? "refined" : rock > 0 ? "rock" : "ungraded";
        return { ...c, count: leads.length, elite, refined, rock, avgScore, topGrade };
      })
      .filter((c): c is ZipCluster => c !== null);
    return { filteredClusters: clusters, filteredLeadsByZip: byZip };
  }, [data, filters]);

  // Build GeoJSON for clusters
  const clusterGeoJSON = useMemo(() => ({
    type: "FeatureCollection" as const,
    features: filteredClusters.map(c => ({
      type: "Feature" as const,
      properties: {
        zip: c.zip,
        count: c.count,
        topGrade: c.topGrade,
        color: gradeColor(c.topGrade),
        avgScore: c.avgScore,
      },
      geometry: { type: "Point" as const, coordinates: [c.lng, c.lat] },
    })),
  }), [filteredClusters]);

  // Build GeoJSON for drive-time circles
  const driveCirclesGeoJSON = useMemo(() => {
    if (!origin) return { type: "FeatureCollection" as const, features: [] };
    const intervals = Array.from(activeIntervals).sort((a, b) => b - a); // largest first so smaller draw on top
    return {
      type: "FeatureCollection" as const,
      features: intervals.map(min => ({
        type: "Feature" as const,
        properties: { minutes: min },
        geometry: {
          type: "Polygon" as const,
          coordinates: [makeCirclePolygon(origin.lng, origin.lat, minutesToMiles(min))],
        },
      })),
    };
  }, [origin, activeIntervals]);

  // Initial map view
  const initialView = useMemo(() => {
    if (data?.clusters?.length) {
      const lngs = data.clusters.map(c => c.lng);
      const lats = data.clusters.map(c => c.lat);
      return {
        longitude: lngs.reduce((a, b) => a + b, 0) / lngs.length,
        latitude:  lats.reduce((a, b) => a + b, 0) / lats.length,
        zoom: 9,
      };
    }
    return { longitude: -98.5, latitude: 39.8, zoom: 4 };
  }, [data]);

  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (settingOrigin) {
      const next = { lng: e.lngLat.lng, lat: e.lngLat.lat };
      setOrigin(next);
      localStorage.setItem(ORIGIN_STORAGE_KEY, JSON.stringify(next));
      setSettingOrigin(false);
      return;
    }
    const features = mapRef.current?.queryRenderedFeatures(e.point, {
      layers: ["cluster-circles"],
    });
    if (features && features.length > 0) {
      const zip = features[0].properties?.zip as string;
      const cluster = filteredClusters.find(c => c.zip === zip);
      if (cluster) setSelectedZip(cluster);
    }
  }, [settingOrigin, filteredClusters]);

  const handleMapHover = useCallback((e: MapMouseEvent) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const features = map.queryRenderedFeatures(e.point, { layers: ["cluster-circles"] });
    map.getCanvas().style.cursor = features.length > 0 ? "pointer" : settingOrigin ? "crosshair" : "";
    if (features.length > 0) {
      const zip = features[0].properties?.zip as string;
      const cluster = filteredClusters.find(c => c.zip === zip);
      setHoveredZip(cluster ?? null);
    } else {
      setHoveredZip(null);
    }
  }, [filteredClusters, settingOrigin]);

  const totalFiltered = filteredClusters.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: CAVE.deep }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex-shrink-0 px-6 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${CAVE.stoneEdge}`, background: "rgba(8,8,8,0.95)", backdropFilter: "blur(12px)" }}>
        <div className="flex items-center gap-3">
          <MapPin className="w-4 h-4" style={{ color: GEM.green }} />
          <div>
            <h1 className="text-[14px] font-bold text-neutral-100 tracking-tight">Territory Map</h1>
            <p className="text-[11px] text-neutral-600">
              {loading ? "Loading…" : `${totalFiltered} leads across ${filteredClusters.length} zips`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => load(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 text-[11px] text-neutral-500 hover:text-neutral-200 transition-colors px-3 py-1.5 rounded-lg disabled:opacity-50"
            style={{ border: `1px solid ${CAVE.stoneEdge}` }}
          >
            <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </header>

      {/* ── Map area ────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-neutral-600" />
              <p className="text-[12px] text-neutral-600">Mapping territory…</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <p className="text-[12px] text-neutral-500">{error}</p>
              <button onClick={() => load()} className="text-[11px] text-neutral-300 underline">Try again</button>
            </div>
          </div>
        ) : (
          <MapGL
            ref={mapRef}
            mapStyle={MAP_STYLE}
            initialViewState={initialView}
            onClick={handleMapClick}
            onMouseMove={handleMapHover}
            attributionControl={false}
            style={{ width: "100%", height: "100%" }}
          >
            <NavigationControl position="bottom-right" showCompass={false} />

            {/* Drive-time circles */}
            {origin && activeIntervals.size > 0 && (
              <Source id="drive-circles" type="geojson" data={driveCirclesGeoJSON}>
                <Layer
                  id="drive-circles-fill"
                  type="fill"
                  paint={{
                    "fill-color": GEM.green,
                    "fill-opacity": ["interpolate", ["linear"], ["get", "minutes"],
                      15, 0.10,
                      120, 0.02,
                    ],
                  }}
                />
                <Layer
                  id="drive-circles-line"
                  type="line"
                  paint={{
                    "line-color": GEM.green,
                    "line-width": 1,
                    "line-opacity": ["interpolate", ["linear"], ["get", "minutes"],
                      15, 0.7,
                      120, 0.25,
                    ],
                    "line-dasharray": [2, 2],
                  }}
                />
              </Source>
            )}

            {/* Origin marker */}
            {origin && (
              <Marker longitude={origin.lng} latitude={origin.lat} anchor="center">
                <div className="relative w-6 h-6">
                  <div className="absolute inset-0 rounded-full" style={{ background: GEM.green, opacity: 0.25 }} />
                  <div className="absolute inset-1.5 rounded-full" style={{ background: GEM.green, boxShadow: `0 0 10px ${GEM.green}` }} />
                </div>
              </Marker>
            )}

            {/* Cluster pins */}
            <Source id="clusters" type="geojson" data={clusterGeoJSON}>
              <Layer
                id="cluster-glow"
                type="circle"
                paint={{
                  "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 14, 50, 36],
                  "circle-color": ["get", "color"],
                  "circle-opacity": 0.15,
                  "circle-blur": 0.6,
                }}
              />
              <Layer
                id="cluster-circles"
                type="circle"
                paint={{
                  "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 8, 50, 22],
                  "circle-color": ["get", "color"],
                  "circle-opacity": 0.85,
                  "circle-stroke-width": 1.5,
                  "circle-stroke-color": "#0a0a0a",
                }}
              />
              <Layer
                id="cluster-labels"
                type="symbol"
                layout={{
                  "text-field": ["get", "count"],
                  "text-size": 11,
                  "text-font": ["Noto Sans Bold"],
                  "text-allow-overlap": true,
                }}
                paint={{
                  "text-color": "#0a0a0a",
                }}
              />
            </Source>

            {/* Hover popup */}
            {hoveredZip && (
              <Popup
                longitude={hoveredZip.lng}
                latitude={hoveredZip.lat}
                anchor="bottom"
                offset={20}
                closeButton={false}
                closeOnClick={false}
                className="lm-map-popup"
              >
                <div className="px-3 py-2 rounded-lg" style={{ background: "#0a0a0a", border: `1px solid ${CAVE.stoneEdge}`, minWidth: 140 }}>
                  <p className="text-[10px] font-bold text-neutral-200">{hoveredZip.zip} {hoveredZip.city ? `· ${hoveredZip.city}` : ""}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">{hoveredZip.count} lead{hoveredZip.count !== 1 ? "s" : ""} · avg {hoveredZip.avgScore}</p>
                  <div className="flex gap-2 mt-1.5 text-[9px]">
                    {hoveredZip.elite > 0   && <span style={{ color: GEM.green }}>● {hoveredZip.elite} elite</span>}
                    {hoveredZip.refined > 0 && <span style={{ color: GEM.yellow }}>● {hoveredZip.refined} refined</span>}
                    {hoveredZip.rock > 0    && <span className="text-neutral-500">● {hoveredZip.rock} rock</span>}
                  </div>
                </div>
              </Popup>
            )}
          </MapGL>
        )}

        {/* ── Filter panel (left) ────────────────────────────────────── */}
        {!loading && !error && (
          <FilterPanel
            open={filterOpen}
            onToggle={() => setFilterOpen(o => !o)}
            filters={filters}
            onChange={setFilters}
          />
        )}

        {/* ── Drive-time panel (top-left, below filter) ──────────────── */}
        {!loading && !error && (
          <DriveTimePanel
            open={drivePanelOpen}
            onToggle={() => setDrivePanelOpen(o => !o)}
            origin={origin}
            settingOrigin={settingOrigin}
            onStartSetOrigin={() => setSettingOrigin(true)}
            onClearOrigin={() => { setOrigin(null); localStorage.removeItem(ORIGIN_STORAGE_KEY); }}
            activeIntervals={activeIntervals}
            onToggleInterval={(min) => {
              setActiveIntervals(prev => {
                const next = new Set(prev);
                if (next.has(min)) next.delete(min);
                else next.add(min);
                return next;
              });
            }}
            offsetTop={filterOpen ? 480 : 56}
          />
        )}

        {/* ── Legend (bottom-left) ───────────────────────────────────── */}
        {!loading && !error && (
          <div className="absolute bottom-6 left-6 px-3 py-2.5 rounded-xl flex items-center gap-3 text-[10px]" style={{ background: "rgba(10,10,10,0.92)", border: `1px solid ${CAVE.stoneEdge}`, backdropFilter: "blur(8px)" }}>
            <span className="text-neutral-600 uppercase tracking-widest font-semibold">Top Grade</span>
            <span className="flex items-center gap-1 text-neutral-300"><span className="w-2 h-2 rounded-full" style={{ background: GEM.green }} />Elite</span>
            <span className="flex items-center gap-1 text-neutral-300"><span className="w-2 h-2 rounded-full" style={{ background: GEM.yellow }} />Refined</span>
            <span className="flex items-center gap-1 text-neutral-300"><span className="w-2 h-2 rounded-full" style={{ background: "#9ca3af" }} />Rock</span>
            <span className="text-neutral-700 ml-1">· Pin size = lead count</span>
          </div>
        )}

        {/* Click-to-set-origin instruction overlay */}
        {settingOrigin && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-2.5 rounded-xl pointer-events-none" style={{ background: "rgba(0,255,136,0.12)", border: `1px solid ${GEM.green}55`, backdropFilter: "blur(6px)" }}>
            <p className="text-[12px] font-semibold flex items-center gap-2" style={{ color: GEM.green }}>
              <Crosshair className="w-3.5 h-3.5" />
              Click anywhere on the map to set your office location
            </p>
          </div>
        )}
      </div>

      {/* ── Zip drawer ───────────────────────────────────────────────── */}
      {selectedZip && (
        <ZipDrawer
          cluster={selectedZip}
          leads={filteredLeadsByZip.get(selectedZip.zip) ?? []}
          onClose={() => setSelectedZip(null)}
        />
      )}
    </div>
  );
}

// ── Filter panel ──────────────────────────────────────────────────────────────

function FilterPanel({
  open, onToggle, filters, onChange,
}: {
  open: boolean;
  onToggle: () => void;
  filters: Filters;
  onChange: (f: Filters) => void;
}) {
  const update = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    onChange({ ...filters, [key]: value });
  };

  const toggleSetItem = <T extends string>(set: Set<T>, item: T): Set<T> => {
    const next = new Set(set);
    if (next.has(item)) next.delete(item);
    else next.add(item);
    return next;
  };

  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="absolute top-6 left-6 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-neutral-300 hover:text-neutral-100 transition-colors"
        style={{ background: "rgba(10,10,10,0.92)", border: `1px solid ${CAVE.stoneEdge}`, backdropFilter: "blur(8px)" }}
      >
        <Filter className="w-3.5 h-3.5" style={{ color: GEM.green }} />
        Filters
      </button>
    );
  }

  return (
    <div
      className="absolute top-6 left-6 w-72 rounded-xl overflow-hidden flex flex-col max-h-[calc(100vh-140px)]"
      style={{ background: "rgba(10,10,10,0.95)", border: `1px solid ${CAVE.stoneEdge}`, backdropFilter: "blur(12px)" }}
    >
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
        <span className="flex items-center gap-2 text-[11px] font-bold text-neutral-200 uppercase tracking-wider">
          <Sliders className="w-3 h-3" style={{ color: GEM.green }} />
          Filters
        </span>
        <button onClick={onToggle} className="w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-neutral-200 hover:bg-white/5">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Gem grade */}
        <FilterSection label="Gem Grade">
          <div className="flex gap-1.5">
            {GRADES.map(g => {
              const active = filters.grades.has(g);
              const color = g === "elite" ? GEM.green : g === "refined" ? GEM.yellow : "#9ca3af";
              return (
                <button
                  key={g}
                  onClick={() => update("grades", toggleSetItem(filters.grades, g))}
                  className={cn(
                    "flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold capitalize transition-all",
                    active ? "text-neutral-900" : "text-neutral-500"
                  )}
                  style={{
                    background: active ? color : "transparent",
                    border: `1px solid ${active ? color : CAVE.stoneEdge}`,
                  }}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Stage */}
        <FilterSection label="Outreach Stage">
          <div className="grid grid-cols-2 gap-1.5">
            {STAGES.map(s => {
              const active = filters.stages.has(s);
              return (
                <button
                  key={s}
                  onClick={() => update("stages", toggleSetItem(filters.stages, s))}
                  className={cn(
                    "px-2 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all",
                    active ? "text-neutral-900" : "text-neutral-500"
                  )}
                  style={{
                    background: active ? GEM.green : "transparent",
                    border: `1px solid ${active ? GEM.green : CAVE.stoneEdge}`,
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Property type */}
        <FilterSection label="Property Type">
          <div className="grid grid-cols-2 gap-1.5">
            {PROPERTY_TYPES.map(t => {
              const active = filters.propertyTypes.has(t);
              const label = t.replace(/_/g, " ");
              return (
                <button
                  key={t}
                  onClick={() => update("propertyTypes", toggleSetItem(filters.propertyTypes, t))}
                  className={cn(
                    "px-2 py-1.5 rounded-lg text-[10px] font-medium capitalize transition-all text-left",
                    active ? "text-neutral-200" : "text-neutral-500"
                  )}
                  style={{
                    background: active ? "rgba(0,255,136,0.08)" : "transparent",
                    border: `1px solid ${active ? `${GEM.green}55` : CAVE.stoneEdge}`,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Sliders */}
        <FilterSection label={`Min Equity: ${filters.equityMin}%`}>
          <input type="range" min={0} max={100} step={5} value={filters.equityMin}
            onChange={e => update("equityMin", parseInt(e.target.value))}
            className="w-full lm-range" />
        </FilterSection>

        <FilterSection label={`Min Years Owned: ${filters.yearsMin}y`}>
          <input type="range" min={0} max={50} step={1} value={filters.yearsMin}
            onChange={e => update("yearsMin", parseInt(e.target.value))}
            className="w-full lm-range" />
        </FilterSection>

        <FilterSection label={`Min Score: ${filters.scoreMin}`}>
          <input type="range" min={0} max={100} step={5} value={filters.scoreMin}
            onChange={e => update("scoreMin", parseInt(e.target.value))}
            className="w-full lm-range" />
        </FilterSection>

        {/* Recency */}
        <FilterSection label="Recently Mined">
          <div className="grid grid-cols-4 gap-1">
            {([
              { label: "All",  value: null },
              { label: "30d",  value: 30   },
              { label: "7d",   value: 7    },
              { label: "24h",  value: 1    },
            ] as const).map(opt => {
              const active = filters.recencyDays === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() => update("recencyDays", opt.value)}
                  className={cn(
                    "px-2 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                    active ? "text-neutral-900" : "text-neutral-500"
                  )}
                  style={{
                    background: active ? GEM.green : "transparent",
                    border: `1px solid ${active ? GEM.green : CAVE.stoneEdge}`,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </FilterSection>

        {/* Toggles */}
        <div className="space-y-2">
          <Toggle label="Absentee owners only" active={filters.absenteeOnly} onChange={v => update("absenteeOnly", v)} />
          <Toggle label="Has phone on file"    active={filters.hasPhone}     onChange={v => update("hasPhone", v)} />
          <Toggle label="Has email on file"    active={filters.hasEmail}     onChange={v => update("hasEmail", v)} />
        </div>

        <button
          onClick={() => onChange(makeDefaultFilters())}
          className="w-full text-[10px] text-neutral-500 hover:text-neutral-200 py-1.5 rounded-lg transition-colors"
          style={{ border: `1px solid ${CAVE.stoneEdge}` }}
        >
          Reset filters
        </button>
      </div>

      <style jsx>{`
        :global(.lm-range) {
          appearance: none;
          height: 3px;
          background: ${CAVE.stoneEdge};
          border-radius: 2px;
          outline: none;
        }
        :global(.lm-range::-webkit-slider-thumb) {
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: ${GEM.green};
          cursor: pointer;
          box-shadow: 0 0 8px ${GEM.green}88;
        }
        :global(.lm-range::-moz-range-thumb) {
          width: 12px;
          height: 12px;
          border: none;
          border-radius: 50%;
          background: ${GEM.green};
          cursor: pointer;
          box-shadow: 0 0 8px ${GEM.green}88;
        }
      `}</style>
    </div>
  );
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function Toggle({ label, active, onChange }: { label: string; active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-colors hover:bg-white/[0.02]"
    >
      <span className="text-[10px] text-neutral-400">{label}</span>
      <div
        className="w-7 h-4 rounded-full relative transition-colors flex-shrink-0"
        style={{ background: active ? GEM.green : "rgba(255,255,255,0.08)" }}
      >
        <div
          className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
          style={{ left: active ? "calc(100% - 14px)" : "2px" }}
        />
      </div>
    </button>
  );
}

// ── Drive-time panel ──────────────────────────────────────────────────────────

function DriveTimePanel({
  open, onToggle, origin, settingOrigin, onStartSetOrigin, onClearOrigin,
  activeIntervals, onToggleInterval, offsetTop,
}: {
  open: boolean;
  onToggle: () => void;
  origin: { lng: number; lat: number } | null;
  settingOrigin: boolean;
  onStartSetOrigin: () => void;
  onClearOrigin: () => void;
  activeIntervals: Set<DriveInterval>;
  onToggleInterval: (m: DriveInterval) => void;
  offsetTop: number;
}) {
  if (!open) {
    return (
      <button
        onClick={onToggle}
        className="absolute left-6 flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold text-neutral-300 hover:text-neutral-100 transition-colors"
        style={{ top: offsetTop, background: "rgba(10,10,10,0.92)", border: `1px solid ${CAVE.stoneEdge}`, backdropFilter: "blur(8px)" }}
      >
        <Clock className="w-3.5 h-3.5" style={{ color: GEM.green }} />
        Drive Time
      </button>
    );
  }

  return (
    <div
      className="absolute left-6 w-72 rounded-xl overflow-hidden"
      style={{ top: offsetTop, background: "rgba(10,10,10,0.95)", border: `1px solid ${CAVE.stoneEdge}`, backdropFilter: "blur(12px)" }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
        <span className="flex items-center gap-2 text-[11px] font-bold text-neutral-200 uppercase tracking-wider">
          <Clock className="w-3 h-3" style={{ color: GEM.green }} />
          Drive Time
        </span>
        <button onClick={onToggle} className="w-5 h-5 flex items-center justify-center rounded text-neutral-500 hover:text-neutral-200 hover:bg-white/5">
          <X className="w-3 h-3" />
        </button>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Origin status */}
        {origin ? (
          <div className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: `${GEM.green}10`, border: `1px solid ${GEM.green}30` }}>
            <span className="text-[10px]" style={{ color: GEM.green }}>
              Office set: {origin.lat.toFixed(3)}, {origin.lng.toFixed(3)}
            </span>
            <button onClick={onClearOrigin} className="text-[9px] text-neutral-500 hover:text-neutral-300">Clear</button>
          </div>
        ) : (
          <button
            onClick={onStartSetOrigin}
            disabled={settingOrigin}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold transition-colors disabled:opacity-50"
            style={{ background: `${GEM.green}10`, border: `1px solid ${GEM.green}30`, color: GEM.green }}
          >
            <Crosshair className="w-3 h-3" />
            {settingOrigin ? "Click on map…" : "Set office location"}
          </button>
        )}

        {/* Interval toggles */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-600 mb-1.5">Intervals (minutes)</p>
          <div className="grid grid-cols-4 gap-1">
            {DRIVE_INTERVALS.map(min => {
              const active = activeIntervals.has(min);
              return (
                <button
                  key={min}
                  onClick={() => onToggleInterval(min)}
                  className={cn(
                    "px-2 py-1.5 rounded-lg text-[10px] font-semibold tabular-nums transition-all",
                    active ? "text-neutral-900" : "text-neutral-500"
                  )}
                  style={{
                    background: active ? GEM.green : "transparent",
                    border: `1px solid ${active ? GEM.green : CAVE.stoneEdge}`,
                  }}
                >
                  {min}
                </button>
              );
            })}
          </div>
          <p className="text-[9px] text-neutral-700 mt-2 leading-relaxed">
            Approximate radius based on 30 mph average. For precise isochrones, integrate Mapbox Directions API later.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Zip drawer ────────────────────────────────────────────────────────────────

function ZipDrawer({
  cluster, leads, onClose,
}: {
  cluster: ZipCluster;
  leads: MapLead[];
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sorted = useMemo(
    () => [...leads].sort((a, b) => b.opportunity_score - a.opportunity_score),
    [leads]
  );

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div
        className="fixed right-0 top-0 bottom-0 z-50 w-[420px] flex flex-col overflow-hidden shadow-2xl"
        style={{ background: CAVE.deep, borderLeft: `1px solid ${CAVE.stoneMid}` }}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 flex items-start justify-between gap-3" style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-600 mb-1">Zip Cluster</p>
            <h2 className="text-[16px] font-bold text-neutral-100 leading-tight">
              {cluster.zip}
              {cluster.city && <span className="text-neutral-500 font-normal"> · {cluster.city}, {cluster.state}</span>}
            </h2>
            <div className="flex items-center gap-3 mt-2 text-[10px]">
              <span className="text-neutral-500">{cluster.count} leads</span>
              <span className="text-neutral-700">·</span>
              <span style={{ color: GEM.green }}>Avg score {cluster.avgScore}</span>
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5">
            <X className="w-4 h-4 text-neutral-500" />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex-shrink-0 grid grid-cols-3 gap-2 px-5 py-3" style={{ borderBottom: `1px solid ${CAVE.stoneEdge}` }}>
          {[
            { label: "Elite",   value: cluster.elite,   color: GEM.green   },
            { label: "Refined", value: cluster.refined, color: GEM.yellow  },
            { label: "Rock",    value: cluster.rock,    color: "#9ca3af"   },
          ].map(s => (
            <div key={s.label} className="rounded-lg px-3 py-2 text-center" style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}>
              <p className="text-[16px] font-bold tabular-nums" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[9px] text-neutral-600 uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Lead list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
          {sorted.map(lead => (
            <ZipDrawerLeadRow key={lead.id} lead={lead} />
          ))}
        </div>
      </div>
    </>
  );
}

function ZipDrawerLeadRow({ lead }: { lead: MapLead }) {
  const [open, setOpen] = useState(false);
  const phone = lead.phone ?? lead.enrichment_data?.phones?.[0];
  const email = lead.email ?? lead.enrichment_data?.emails?.[0];
  const equity = lead.equity_percent != null ? Math.round(lead.equity_percent) : null;
  const yrs    = lead.years_owned    != null ? Math.round(lead.years_owned)    : null;

  return (
    <div className="rounded-lg overflow-hidden" style={{ background: CAVE.stoneDeep, border: `1px solid ${CAVE.stoneEdge}` }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <GemGrade grade={lead.gem_grade} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-neutral-200 truncate">{lead.owner_name ?? "Unknown owner"}</p>
          <p className="text-[10px] text-neutral-600 truncate">{lead.property_address ?? "—"}</p>
        </div>
        <span className="text-[12px] font-bold tabular-nums flex-shrink-0" style={{ color: GEM.green }}>{lead.opportunity_score}</span>
        <ChevronDown className="w-3 h-3 text-neutral-600 transition-transform flex-shrink-0" style={{ transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2" style={{ borderTop: `1px solid ${CAVE.stoneEdge}` }}>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <Stat label="Equity" value={equity != null ? `${equity}%` : "—"} />
            <Stat label="Yrs Owned" value={yrs != null ? `${yrs}y` : "—"} />
            <Stat label="Type" value={lead.property_type?.replace(/_/g, " ") ?? "—"} />
            <Stat label="Stage" value={lead.stage ?? "new"} />
          </div>
          <div className="space-y-1">
            {phone && (
              <a href={`tel:${phone}`} className="flex items-center gap-2 text-[11px]" style={{ color: GEM.green }}>
                <Phone className="w-3 h-3" />{phone}
              </a>
            )}
            {email && (
              <a href={`mailto:${email}`} className="flex items-center gap-2 text-[11px] truncate" style={{ color: GEM.green }}>
                <Mail className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{email}</span>
              </a>
            )}
            {!phone && !email && <p className="text-[10px] text-neutral-700">No contact info on file</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded px-2 py-1 capitalize" style={{ background: "rgba(255,255,255,0.02)" }}>
      <p className="text-[8px] text-neutral-700 uppercase tracking-widest">{label}</p>
      <p className="text-[10px] font-semibold text-neutral-300 mt-0.5">{value}</p>
    </div>
  );
}