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
  };
  products: Product[];
}

import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";

export default function VisitasPage() {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchCloud = async () => {
      try {
        const q = query(collection(db, "visitas"), orderBy("date", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as Visit[];
        setVisits(data);
        setLoading(false);
      } catch (e) {
        console.error("No se pudo cargar de Firebase, usando fallback local", e);
        const data = localStorage.getItem("visits");
        if (data) {
          try {
            setVisits(JSON.parse(data));
          } catch(err) {}
        }
        setLoading(false);
      }
    };
    fetchCloud();
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
          📥 Exportar CSV de la Base de Datos
        </button>
      </div>

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
                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary)' }}>{visit.client.name}</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(visit.date).toLocaleDateString()}</span>
              </div>
              
              <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <p><strong>Email:</strong> {visit.client.email}</p>
                <p><strong>WhatsApp:</strong> {visit.client.phone}</p>
                {visit.client.establishmentName && <p><strong>Establecimiento:</strong> {visit.client.establishmentName}</p>}
                {visit.client.establishmentZone && <p><strong>Zona:</strong> {visit.client.establishmentZone}</p>}
                {visit.client.farmSize && <p><strong>Tamaño Ext.:</strong> {visit.client.farmSize}</p>}
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
    </div>
  );
}
