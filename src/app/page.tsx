"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    establishmentName: "",
    establishmentZone: "",
    farmSize: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to session storage so the cart can attribute the interaction to this client
    sessionStorage.setItem("clientData", JSON.stringify(formData));
    router.push("/productos");
  };

  return (
    <div className="animate-fade-in" style={{ minHeight: '90vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem 0' }}>
      <div className="glass-panel" style={{ padding: '2.5rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Image 
            src="/logo.jpg" 
            alt="Dairy Solutions Logo" 
            width={140} 
            height={140} 
            style={{ objectFit: 'contain', borderRadius: '12px' }}
            priority
          />
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', color: 'var(--primary)' }}>
          TodoLactea
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '2.5rem', color: 'var(--text-muted)' }}>
          Registra al visitante para comenzar.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Nombre Completo *</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Ej. Juan Pérez" 
              required
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email *</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="correo@ejemplo.com" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Teléfono (WhatsApp) *</label>
            <input 
              type="tel" 
              className="input-field" 
              placeholder="+54 9 11 1234-5678" 
              required
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          
          <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0', paddingTop: '1rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Datos del Establecimiento</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Nombre del establecimiento *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej. Estancia Las Pampas" 
                  required
                  value={formData.establishmentName}
                  onChange={(e) => setFormData({...formData, establishmentName: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Zona del establecimiento *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej. Córdoba / Santa Fe" 
                  required
                  value={formData.establishmentZone}
                  onChange={(e) => setFormData({...formData, establishmentZone: e.target.value})}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Tamaño de la explotación *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Ej. 500 hectáreas, 200 vacas" 
                  required
                  value={formData.farmSize}
                  onChange={(e) => setFormData({...formData, farmSize: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary animate-fade-in" style={{ marginTop: '1rem', width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
            Acceder a Productos
          </button>
        </form>
      </div>
      
      <div style={{ textAlign: 'center', marginTop: '1.5rem', marginBottom: '2rem' }}>
        <Link href="/visitas" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', opacity: 0.7, textDecoration: 'underline' }}>
          Admin: Panel de Visitas
        </Link>
      </div>
    </div>
  );
}
