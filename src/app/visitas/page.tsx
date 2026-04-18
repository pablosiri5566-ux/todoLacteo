"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  name: string;
}

interface Visit {
  id: string;
  date: string;
  client: {
    name: string;
    email: string;
    phone: string;
    establishmentName?: string;
    establishmentZone?: string;
    farmSize?: string;
    sellerName?: string;
  };
  products: Product[];
}

import { collection, getDocs, getDocsFromServer, getDocsFromCache, query, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function VisitasPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<"pending" | "cloud" | "local">("pending");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any[] | null>(null);
  const router = useRouter();

  const fetchCloud = async (forceServer = false) => {
    setLoading(true);
    setSyncError(null);
    try {
      // Very basic query to avoid indexing issues at the trade show
      const q = query(collection(db, "visitas"));
      
      let snapshot;
      try {
        snapshot = forceServer 
          ? await getDocsFromServer(q) 
          : await getDocs(q);
      } catch (e: any) {
        console.warn("Fallo el servidor, intentando leer de cache persistente...");
        try {
          snapshot = await getDocsFromCache(q);
        } catch (cacheErr) {
          console.error("Cache falló también:", cacheErr);
          snapshot = null;
        }
      }
        
      const rawDocs = snapshot && snapshot.docs ? snapshot.docs.map(doc => doc.data()) : [];
      setDebugData(rawDocs);
        
      const data = snapshot && snapshot.docs ? snapshot.docs
        .filter((doc: any) => {
          const d = doc.data();
          // Filter out completely empty or null records
          return d && d.client !== null;
        })
        .map((doc: any) => {
          const d = doc.data();
          let finalDate = d.date || "";
          
          // CRITICAL FIX: Ensure finalDate is a valid date string that including sub-seconds if available
          // If machine date is 2024 but client.date says 2026, use 2026 for sorting/display
          if (finalDate.includes("2024") && d.client?.date?.includes("2026")) {
            finalDate = finalDate.replace("2024", "2026");
          }

          return { 
            id: doc.id, 
            date: finalDate,
            client: d.client || {},
            products: d.products || []
          };
        }) : [] as Visit[];
      
      // Super robust sorting for old browsers (like IE/Old Safari)
      const sortedData = data.sort((a, b) => {
        const getTs = (dStr: any) => {
          if (!dStr) return 0;
          const ts = new Date(dStr).getTime();
          if (!isNaN(ts)) return ts;
          const parts = String(dStr).split(/[\/\-]/);
          if (parts.length === 3) {
            const d = parseInt(parts[0]);
            const m = parseInt(parts[1]) - 1;
            const y = parseInt(parts[2]);
            return new Date(y, m, d).getTime();
          }
          return 0;
        };
        const dateA = getTs(a.date);
        const dateB = getTs(b.date);
        return dateB - dateA;
      });
      
      if (sortedData.length > 0) {
        setVisits(sortedData);
        setSyncStatus(snapshot && snapshot.metadata && snapshot.metadata.fromCache ? "local" : "cloud");
      } else {
        try {
          const localData = localStorage.getItem("visits");
          if (localData) {
            const parsed = JSON.parse(localData);
            if (Array.isArray(parsed)) setVisits(parsed);
          }
        } catch(e) {}
      }
      
      setLoading(false);
    } catch (e: any) {
      console.error("Error crítico de acceso a datos:", e);
      const msg = e.code === 'permission-denied' 
        ? "ACCESO DENEGADO: Las reglas de seguridad de Firebase podrían haber expirado (revisa la consola de Firebase)." 
        : e.message || "Error al conectar con la base de datos";
        
      setSyncError(msg);
      
      const data = localStorage.getItem("visits");
      if (data) {
        try {
          setVisits(JSON.parse(data));
          setSyncStatus("local");
        } catch(err) {}
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "visitas"));
    
    // Subscribe to real-time updates
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const rawDocs = snapshot.docs.map(doc => doc.data());
      setDebugData(rawDocs);

      const data = snapshot.docs
        .filter((doc) => {
          const d = doc.data();
          return d && d.client !== null;
        })
        .map((doc) => {
          const d = doc.data();
          let finalDate = d.date || "";
          
          if (finalDate.includes("2024") && d.client?.date?.includes("2026")) {
            finalDate = finalDate.replace("2024", "2026");
          }

          return { 
            id: doc.id, 
            date: finalDate,
            client: d.client || {},
            products: d.products || []
          } as Visit;
        });

      // Sort by date (descending)
      const sortedData = data.sort((a, b) => {
        const getTs = (dStr: any) => {
          if (!dStr) return 0;
          const ts = new Date(dStr).getTime();
          if (!isNaN(ts)) return ts;
          return 0;
        };
        return getTs(b.date) - getTs(a.date);
      });

      setVisits(sortedData);
      setSyncStatus(snapshot.metadata.fromCache ? "local" : "cloud");
      setLoading(false);
    }, (error) => {
      console.error("Error en tiempo real:", error);
      setSyncError("Error al conectar con la base de datos en tiempo real.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const exportCSV = () => {
    if (visits.length === 0) return;
    
    // Convertir las cabeceras
    const headers = [
      "Fecha", 
      "Nombre", 
      "Email", 
      "Telefono", 
      "Establecimiento", 
      "Zona", 
      "Tamano", 
      "Vendedor",
      "Productos Enviados"
    ];
    
    const rows = visits.map(v => {
      return [
        new Date(v.date).toLocaleString(),
        v.client.name,
        v.client.email,
        v.client.phone,
        v.client.establishmentName || "",
        v.client.establishmentZone || "",
        v.client.farmSize || "",
        v.client.sellerName || "No registrado",
        v.products.map(p => p.name).join(" | ")
      ];
    });
    
    // Construir CSV
    const csvContent = [headers, ...rows].map(e => e.map(item => `"${item}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `visitas_todolactea_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ color: 'var(--primary)' }}>Panel de Visitas</h1>
        <Link href="/" className="btn btn-outline" style={{ fontSize: '0.9rem' }}>
          Volver al Inicio
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={exportCSV} disabled={visits.length === 0 || loading} className="btn btn-primary" style={{ flex: 1 }}>
          📥 Exportar CSV de Nube
        </button>
        <button onClick={() => fetchCloud(true)} disabled={loading} className="btn btn-outline" style={{ flex: 1 }}>
          {loading ? 'Sincronizando...' : '🔄 Forzar Sincronización'}
        </button>
      </div>

      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: syncStatus === 'cloud' ? '#25D366' : syncStatus === 'local' ? '#ffc107' : '#999' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: syncStatus === 'cloud' ? '#25D366' : syncStatus === 'local' ? '#ffc107' : 'var(--text-muted)' }}>
          {syncStatus === 'cloud' ? 'Sincronizado: Base de Datos en la Nube' : syncStatus === 'local' ? 'Memoria Local (Offline)' : 'Pendiente...'}
        </span>
      </div>

      {syncError && (
        <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', border: '1px solid #ff6b6b', background: 'rgba(255, 107, 107, 0.05)' }}>
          <p style={{ color: '#ff6b6b', fontSize: '0.85rem', margin: 0 }}>
            <strong>Error Nube:</strong> {syncError}. <br/>
            Si el error persiste, verifica la conexión o permisos en la consola de Firebase.
          </p>
        </div>
      )}

      {loading ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--primary)', fontWeight: 600 }}>Cargando visitas desde la nube...</p>
        </div>
      ) : visits.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)' }}>No hay visitas registradas aún.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {visits.map(visit => (
            <div key={visit.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>{visit.client?.name || "Cliente sin nombre"}</h3>
                <span style={{ fontSize: '0.7rem', color: 'var(--primary)', opacity: 0.6, fontWeight: 700 }}>
                  v1.8 - Sincro Tiempo Real
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                  {visit.date ? new Date(visit.date).toLocaleString('es-AR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : "Sin fecha"}
                </span>
              </div>
              
              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <p><strong>Email:</strong> {visit.client?.email || 'N/A'}</p>
                <p><strong>WhatsApp:</strong> {visit.client?.phone || 'N/A'}</p>
                {visit.client?.establishmentName && <p><strong>Establecimiento:</strong> {visit.client.establishmentName}</p>}
                {visit.client?.establishmentZone && <p><strong>Zona:</strong> {visit.client.establishmentZone}</p>}
                {visit.client?.farmSize && <p><strong>Tamaño Ext.:</strong> {visit.client.farmSize}</p>}
                <p style={{ marginTop: '0.4rem', color: 'var(--primary)', fontWeight: 600 }}>👤 Vendedor: {visit.client?.sellerName || 'No especificado'}</p>
              </div>

              {visit.products.length > 0 && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>Productos Enviados ({visit.products.length})</h4>
                  <ul style={{ listStyle: 'none', paddingLeft: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {visit.products.map(p => (
                      <li key={p.id} style={{ marginBottom: '0.2rem' }}>• {p.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {debugData && debugData.length > 0 && (
        <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
          <details>
            <summary style={{ fontSize: '0.7rem', color: 'var(--text-muted)', cursor: 'pointer', opacity: 0.5 }}>
              [Panel Diagnóstico v1.5 - Datos Crudos Nube]
            </summary>
            <div style={{ marginTop: '1rem', background: '#000', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }}>
              <pre style={{ fontSize: '0.65rem', color: '#25D366', fontFamily: 'monospace' }}>
                {JSON.stringify(debugData.slice(0, 5), null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
