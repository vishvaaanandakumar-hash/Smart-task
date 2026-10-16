import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Navigation,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sliders,
  Compass,
  Play,
  Layers,
  Sparkles
} from "lucide-react";
import { api } from "../api";
import RadarBeacon3D from "../components/RadarBeacon3D";

// Custom Leaflet Icons
const userIcon = L.divIcon({
  className: "custom-user-icon",
  html: `
    <div style="position:relative;width:24px;height:24px;">
      <div style="position:absolute;inset:0;background:rgba(59,130,246,0.3);border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
      <div style="position:relative;width:20px;height:20px;margin:2px;background:#2563EB;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

const taskIcon = L.divIcon({
  className: "custom-task-icon",
  html: `
    <div style="background:#4F46E5;color:white;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 8px rgba(0,0,0,0.25);">
      <div style="transform:rotate(45deg);font-size:13px;">📍</div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

const triggeredTaskIcon = L.divIcon({
  className: "custom-triggered-task-icon",
  html: `
    <div style="background:#10B981;color:white;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 3px 8px rgba(16,185,129,0.4);">
      <div style="transform:rotate(45deg);font-size:13px;">✓</div>
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

function MapRecenter({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(coords, map.getZoom(), { duration: 1.0 });
  }, [coords[0], coords[1]]);
  return null;
}

function ClickToMove({ onMove }: { onMove: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMove(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [realPos, setRealPos] = useState<{ lat: number; lng: number } | null>(null);
  const [simPos, setSimPos] = useState<{ lat: number; lng: number }>({ lat: 13.0067, lng: 80.1187 });
  const [isRealMonitoring, setIsRealMonitoring] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Supermarket");
  const [nearbyPlaces, setNearbyPlaces] = useState<any[]>([]);
  const [notificationLog, setNotificationLog] = useState<any[]>([]);
  const [geofenceReport, setGeofenceReport] = useState<any[]>([]);
  const [simulatorStatus, setSimulatorStatus] = useState<string>("Ready. Pick a simulated preset below or click on the map.");
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  const watchId = useRef<number | null>(null);

  async function loadReminders() {
    try {
      const data = await api.listLocationReminders();
      setReminders(data);
    } catch {}
  }

  useEffect(() => {
    loadReminders();
    if (typeof Notification !== "undefined") {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const activePos = realPos || simPos;

  // Request browser Notification Permission
  async function requestNotificationPermission() {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === "granted") {
        new Notification("SmartTask Location Enabled", {
          body: "You will receive real geofence notifications when arriving near tasks.",
          icon: "/favicon.png",
        });
      }
    }
  }

  // Real Geolocation Watcher
  function toggleRealGPS() {
    if (isRealMonitoring) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
      setIsRealMonitoring(false);
      setRealPos(null);
      setSimulatorStatus("Real GPS monitoring stopped.");
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
      }
      setSimulatorStatus("Acquiring high-accuracy GPS fix...");
      watchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setRealPos({ lat: latitude, lng: longitude });
          setIsRealMonitoring(true);
          setSimulatorStatus(`🟢 GPS Active (±${Math.round(accuracy)}m accuracy)`);
          
          // Feed coordinates to geofence engine
          await processGeofenceCheck(latitude, longitude, "Real GPS");
        },
        (error) => {
          setIsRealMonitoring(false);
          setSimulatorStatus(`🔴 Location error: ${error.message}`);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
      );
    }
  }

  // Core Geofence Check Execution
  async function processGeofenceCheck(lat: number, lng: number, sourceLabel: string) {
    try {
      const res = await api.checkGeofence(lat, lng);
      setGeofenceReport(res.reminders || []);

      if (res.triggered && res.triggered.length > 0) {
        const trigger = res.triggered[0];
        const newMsg = `🚨 ${trigger.message} (${trigger.distance_m}m away)`;
        
        // Add to log
        setNotificationLog((prev) => [
          { id: Date.now(), msg: trigger.message, time: new Date().toLocaleTimeString(), source: sourceLabel },
          ...prev.slice(0, 7),
        ]);

        setSimulatorStatus(`🔔 ENTER GEOFENCE DETECTED! Notification triggered for "${trigger.label}"`);

        // Trigger Real Browser Notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("SmartTask Location Reminder", {
            body: trigger.message,
            icon: "/favicon.png",
          });
        }

        // Reload reminders to reflect status
        loadReminders();
      } else {
        const anyInside = res.reminders?.some((r: any) => r.is_inside);
        if (anyInside) {
          setSimulatorStatus("📍 Currently inside geofence — duplicate notifications safely suppressed.");
        } else {
          setSimulatorStatus(`Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) checked — outside all geofences.`);
        }
      }
    } catch (e: any) {
      setSimulatorStatus(`Error checking geofence: ${e.message}`);
    }
  }

  // Simulator Step Movement
  async function simulateMoveTo(targetLat: number, targetLng: number, locationName: string) {
    setSimulatorStatus(`Simulating travel towards ${locationName}...`);
    const steps = 6;
    const startLat = simPos.lat;
    const startLng = simPos.lng;

    for (let i = 1; i <= steps; i++) {
      await new Promise((r) => setTimeout(r, 160));
      const curLat = startLat + (targetLat - startLat) * (i / steps);
      const curLng = startLng + (targetLng - startLng) * (i / steps);
      setSimPos({ lat: curLat, lng: curLng });
    }

    await processGeofenceCheck(targetLat, targetLng, `Simulator: ${locationName}`);
  }

  // Search Places using Nominatim
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.searchPlaces(searchQuery, activePos.lat, activePos.lng);
      setSearchResults(res.results || []);
    } catch {}
    finally {
      setIsSearching(false);
    }
  }

  // Category Quick Search using Overpass
  async function handleCategorySearch(cat: string) {
    setSelectedCategory(cat);
    try {
      const res = await api.nearby(activePos.lat, activePos.lng, cat, 2500);
      setNearbyPlaces(res.places || []);
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="text-indigo-600 dark:text-indigo-400" size={24} />
            Location-Aware Reminders & Geofencing
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Real geofencing triggers reminders automatically when you enter within a configured radius of your task.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {notificationPermission !== "granted" && (
            <button
              onClick={requestNotificationPermission}
              className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
            >
              <Bell size={13} /> Enable Browser Notifications
            </button>
          )}

          <button
            onClick={toggleRealGPS}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isRealMonitoring
                ? "bg-rose-600 text-white shadow-sm"
                : "border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
            }`}
          >
            <Compass size={14} className={isRealMonitoring ? "animate-spin" : ""} />
            {isRealMonitoring ? "Stop Real GPS" : "Track My Real Location"}
          </button>
        </div>
      </div>

      {/* 3D Beacon Status Strip */}
      <div className="card p-4 flex flex-col md:flex-row items-center justify-between gap-4 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 dark:from-[#0F172A] dark:via-indigo-950/20 dark:to-[#0F172A]">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900/5 dark:bg-slate-800 flex-shrink-0">
            <RadarBeacon3D isMonitoring={true} activeCount={reminders.length} />
          </div>
          <div>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Geofence Radar Status
            </div>
            <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
              {simulatorStatus}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500 flex-shrink-0">
          <div>
            Active Geofences: <strong className="text-slate-800 dark:text-slate-200">{reminders.filter(r => r.status !== "disabled").length}</strong>
          </div>
          <div>
            Coordinates: <strong className="text-slate-800 dark:text-slate-200">{activePos.lat.toFixed(4)}, {activePos.lng.toFixed(4)}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Map + Simulator Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* Map Container */}
        <div className="card overflow-hidden h-[540px] relative border-slate-200 dark:border-slate-800">
          <MapContainer
            center={[activePos.lat, activePos.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <MapRecenter coords={[activePos.lat, activePos.lng]} />
            <ClickToMove onMove={(lat, lng) => {
              setSimPos({ lat, lng });
              processGeofenceCheck(lat, lng, "Map Click");
            }} />

            {/* User / Simulator Marker */}
            <Marker position={[activePos.lat, activePos.lng]} icon={userIcon}>
              <Popup>
                <div className="text-xs space-y-1">
                  <strong>You are here</strong>
                  <div>Lat: {activePos.lat.toFixed(4)}</div>
                  <div>Lng: {activePos.lng.toFixed(4)}</div>
                  <div className="text-[10px] text-slate-400">Click anywhere to reposition</div>
                </div>
              </Popup>
            </Marker>

            {/* Saved Reminder Geofences */}
            {reminders.map((r) => {
              const isTriggered = r.status === "triggered" || r.is_inside;
              return (
                <div key={r.id}>
                  {/* Geofence Circle Radius */}
                  <Circle
                    center={[r.lat, r.lng]}
                    radius={r.radius_m}
                    pathOptions={{
                      color: isTriggered ? "#10B981" : "#4F46E5",
                      fillColor: isTriggered ? "#10B981" : "#6366F1",
                      fillOpacity: isTriggered ? 0.25 : 0.12,
                      weight: 2,
                      dashArray: isTriggered ? "" : "4, 6",
                    }}
                  />
                  {/* Location Marker */}
                  <Marker
                    position={[r.lat, r.lng]}
                    icon={isTriggered ? triggeredTaskIcon : taskIcon}
                  >
                    <Popup>
                      <div className="text-xs space-y-1 p-0.5">
                        <div className="font-bold text-sm text-slate-900">{r.label}</div>
                        <div className="text-slate-500">{r.category} · {r.radius_m}m Geofence</div>
                        {r.task && <div className="text-indigo-600 font-medium">Task: {r.task.title}</div>}
                        <div className="text-[10px] font-semibold">
                          Status: <span className={isTriggered ? "text-emerald-600 font-bold" : "text-amber-600"}>{r.status}</span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </div>
              );
            })}
          </MapContainer>

          {/* Map Overlay Badge */}
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-md z-[1000] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span> User Position
            <span className="w-2 h-2 rounded-full bg-indigo-500 ml-2"></span> Geofence Perimeter
            <span className="w-2 h-2 rounded-full bg-emerald-500 ml-2"></span> Triggered
          </div>
        </div>

        {/* Sidebar Controls: Simulator & Nearby POI */}
        <div className="space-y-5">
          {/* ⭐ DEMO LOCATION SIMULATOR CARD */}
          <div className="card p-5 border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-b from-white to-indigo-50/20 dark:from-[#111827] dark:to-indigo-950/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 tracking-wide uppercase">
                Demo Simulator
              </span>
              <Sparkles size={14} className="text-indigo-500" />
            </div>

            <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
              Geofence Travel Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed">
              Test real geofencing by simulating movement. Stepping inside a 200m radius will trigger the actual notification pipeline.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => simulateMoveTo(13.0067, 80.1187, "Reliance Fresh Supermarket")}
                className="w-full text-left p-3 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-white dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600">
                    🛒 Enter Supermarket (Inside 200m)
                  </div>
                  <div className="text-[10px] text-slate-400">Triggers: "Buy Milk & Groceries"</div>
                </div>
                <Play size={14} className="text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => simulateMoveTo(13.0078, 80.1205, "Gold's Fitness Gym")}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600">
                    🏋️ Enter Gym (Inside 250m)
                  </div>
                  <div className="text-[10px] text-slate-400">Triggers: "Fitness Gym Workout"</div>
                </div>
                <Play size={14} className="text-indigo-500 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => simulateMoveTo(12.9900, 80.1000, "Home (1.5 km Away)")}
                className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    🏠 Move to Home (Outside all geofences)
                  </div>
                  <div className="text-[10px] text-slate-400">Re-arms all monitoring geofences</div>
                </div>
                <RotateCcw size={14} className="text-slate-400 group-hover:rotate-45 transition-transform" />
              </button>
            </div>
          </div>

          {/* Location Search & Places */}
          <div className="card p-5 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Search size={15} /> Find & Set Location
            </h3>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search place or address..."
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="btn-primary text-xs py-1.5 px-3 flex-shrink-0"
              >
                {isSearching ? "..." : "Search"}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {searchResults.map((p, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setSimPos({ lat: p.lat, lng: p.lng });
                      processGeofenceCheck(p.lat, p.lng, `Picked: ${p.name}`);
                    }}
                    className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 cursor-pointer text-xs transition-colors"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{p.address}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-500 mb-2">Category Quick Filter:</div>
              <div className="flex flex-wrap gap-1.5">
                {["Supermarket", "Pharmacy", "College", "Gym", "Shopping mall"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategorySearch(cat)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Location Reminders Table */}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-display font-bold text-base text-slate-900 dark:text-white">
            Configured Location Reminders ({reminders.length})
          </h3>
          <span className="text-xs text-slate-500">Live distance calculated via Haversine formula</span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {reminders.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No location reminders created yet. Create a task with location attached on the Tasks page.
            </div>
          ) : (
            reminders.map((r) => {
              const liveReport = geofenceReport.find((g) => g.id === r.id);
              const dist = liveReport?.distance_m;
              const isInside = liveReport?.is_inside ?? r.is_inside;

              return (
                <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{r.label}</span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {r.category}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      Geofence Radius: <strong className="text-slate-700 dark:text-slate-300">{r.radius_m} meters</strong>
                      {r.address && <span> · {r.address}</span>}
                    </div>

                    {dist !== undefined && (
                      <div className="text-xs font-medium flex items-center gap-1.5 mt-1">
                        <Navigation size={12} className="text-indigo-500" />
                        <span>Distance from current position: <strong>{dist}m</strong></span>
                        {isInside && (
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            INSIDE GEOFENCE
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={async () => {
                        await api.resetLocationReminder(r.id);
                        loadReminders();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      title="Re-arm geofence for triggering"
                    >
                      Re-arm Geofence
                    </button>

                    <button
                      onClick={async () => {
                        const newStatus = r.status === "disabled" ? "monitoring" : "disabled";
                        await api.setLocationStatus(r.id, newStatus);
                        loadReminders();
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      {r.status === "disabled" ? "Enable" : "Disable"}
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm(`Remove location reminder "${r.label}"?`)) {
                          await api.deleteLocationReminder(r.id);
                          loadReminders();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
