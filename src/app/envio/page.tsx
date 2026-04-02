"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { collection, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Product {
  id: string;
  name: string;
  pdf: string;
}

export default function Envio() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [cartItems, setCartItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedClient = sessionStorage.getItem("clientData");
    const savedCart = sessionStorage.getItem("cart");

    if (savedClient) {
      setClient(JSON.parse(savedClient));
    } else {
      router.push("/");
      return;
    }

    if (savedCart) {
      const cartIds: string[] = JSON.parse(savedCart);
      fetch(`/data/products.json?v=${Date.now()}`)
        .then(res => res.json())
        .then((data: Product[]) => {
          // Robust mapping using string IDs and trimming
          const items = data.filter(p => cartIds.map(id => String(id).trim()).includes(p.id.trim()));
          setCartItems(items);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [router]);

  const saveVisitToCloud = async () => {
    if (sessionStorage.getItem("visitSaved")) return;
    
    const newVisit = {
      date: new Date().toISOString(),
      client,
      products: cartItems
    };

    // Immediate local backup
    const history = JSON.parse(localStorage.getItem("visits") || "[]");
    localStorage.setItem("visits", JSON.stringify([...history, { id: Date.now().toString(), ...newVisit }]));

    try {
      // Background save to Firestore
      addDoc(collection(db, "visitas"), newVisit).then(() => {
        sessionStorage.setItem("visitSaved", "true");
      });
    } catch (e) {
      console.error("Error al disparar guardado en Firebase:", e);
    }
  };

  const generateMessageText = (isWhatsapp: boolean) => {
    const baseUrl = window.location.origin;
    let text = `Hola ${client.name},\n\nGracias por visitarnos en nuestro stand de TodoLactea. Te compartimos la información técnica de los productos de tu interés:\n\n`;
    
    cartItems.forEach(item => {
      text += `✅ ${isWhatsapp ? '*' : ''}${item.name}${isWhatsapp ? '*' : ''}\n🔗 Ver ficha: ${baseUrl}/productos/${item.id}\n\n`;
    });
    
    text += `Estamos a tu entera disposición para resolver cualquier duda.\n\nAtentamente,\n${isWhatsapp ? '*' : ''}El equipo de Dairy Solutions${isWhatsapp ? '*' : ''}\n📧 email: dairy@dairy.com.ar\n📱 tel: +54 9 11 6907-4492`;
    return text;
  }

  const handleWhatsApp = () => {
    if (cartItems.length === 0) return;
    saveVisitToCloud(); // Fire and forget (it saves to local first)
    
    // Improved phone cleaning for Argentina
    let cleanPhone = client.phone?.replace(/[\s\+\-]/g, '') || '';
    
    // If it starts with 11, 249, 351, etc (Argentine area codes) and lacks 549
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) {
        cleanPhone = '549' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('9')) {
        cleanPhone = '54' + cleanPhone;
    } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('54')) {
        // likely 011... or 15... but already has some length, just ensure 549
        cleanPhone = '549' + cleanPhone.substring(cleanPhone.startsWith('0') ? 1 : 0);
    }

    const text = generateMessageText(true);
    const wplink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(wplink, '_blank');
  };

  const handleEmail = () => {
    if (cartItems.length === 0) return;
    saveVisitToCloud();
    
    const text = generateMessageText(false);
    const mailto = `mailto:${client.email}?bcc=dairy@dairy.com.ar&subject=Catálogo TodoLactea - Dairy Solutions&body=${encodeURIComponent(text)}`;
    window.location.href = mailto;
  };

  const clearSession = () => {
    saveVisitToCloud();
    sessionStorage.removeItem("clientData");
    sessionStorage.removeItem("cart");
    sessionStorage.removeItem("visitSaved");
    router.push("/");
  };

  if (loading || !client) return null;

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '1.5rem', textAlign: 'center' }}>Resumen y Envío</h1>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>Datos del Visitante</h3>
        <p style={{ marginBottom: '0.4rem' }}><strong>Nombre:</strong> {client.name}</p>
        <p style={{ marginBottom: '0.4rem' }}><strong>Email:</strong> {client.email}</p>
        <p style={{ marginBottom: '0.4rem' }}><strong>Teléfono:</strong> {client.phone}</p>
        {client.establishmentName && <p style={{ marginBottom: '0.4rem' }}><strong>Establecimiento:</strong> {client.establishmentName}</p>}
        {client.establishmentZone && <p style={{ marginBottom: '0.4rem' }}><strong>Zona:</strong> {client.establishmentZone}</p>}
        {client.farmSize && <p style={{ marginBottom: '0.4rem' }}><strong>Tamaño:</strong> {client.farmSize}</p>}
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>
          Productos Separados ({cartItems.length})
        </h3>
        {cartItems.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No has seleccionado ningún producto aún.</p>
        ) : (
          <ul style={{ listStyle: 'none' }}>
            {cartItems.map(item => (
              <li key={item.id} style={{ margin: '0.75rem 0', display: 'flex', gap: '0.5rem', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--primary)' }}>📄</span> 
                <span style={{ fontWeight: 500 }}>{item.name}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <button 
          onClick={handleWhatsApp} 
          disabled={cartItems.length === 0} 
          className="btn btn-primary" 
          style={{ fontSize: '1.1rem', background: '#25D366', color: 'white', border: 'none' }}
        >
          📱 Enviar por WhatsApp
        </button>
        
        <button 
          onClick={handleEmail}
          disabled={cartItems.length === 0} 
          className="btn btn-outline" 
          style={{ fontSize: '1.1rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
        >
          📧 Enviar por Email
        </button>
      </div>

      <div style={{ marginTop: '3.5rem', display: 'flex', justifyContent: 'space-between', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
        <Link href="/productos" className="btn btn-outline" style={{ fontSize: '0.9rem', width: '100%', padding: '1rem' }}>
          Volver al Catálogo
        </Link>
        <button onClick={clearSession} className="btn btn-outline" style={{ fontSize: '0.9rem', color: '#ff6b6b', borderColor: '#ff6b6b', width: '100%', padding: '1rem' }}>
          Cerrar Módulo y Atender al Siguiente
        </button>
      </div>
    </div>
  );
}
