"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface Product {
  id: string;
  name: string;
  description: string;
  pdf: string;
  page: number;
}

interface CartItem extends Product {
  precio: number;
  cantidad: number;
  descuento: number;
}

export default function PresupuestoPage() {
  const router = useRouter();
  const [client, setClient] = useState<any>(null);
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states
  const [moneda, setMoneda] = useState<"USD" | "ARS" | "EUR">("USD");
  const [ivaRate, setIvaRate] = useState<number>(10.5); // Default as in template
  const [ivaIncluido, setIvaIncluido] = useState<boolean>(true); // Default as in template
  const [notes, setNotes] = useState<string>("");
  
  // Secondary currency conversion
  const [compMoneda, setCompMoneda] = useState<"ARS" | "USD" | "EUR" | "">("ARS");
  const [tipoCambio, setTipoCambio] = useState<number>(0);

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
          const cartProducts = data
            .filter(p => cartIds.map(id => String(id).trim()).includes(p.id.trim()))
            .map(p => ({
              ...p,
              precio: 0,
              cantidad: 1,
              descuento: 0
            }));
          setItems(cartProducts);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [router]);

  const handleItemChange = (index: number, field: "precio" | "cantidad" | "descuento", value: number) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setItems(newItems);
  };

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      const itemSubtotal = item.precio * item.cantidad * (1 - item.descuento / 100);
      return acc + itemSubtotal;
    }, 0);
  };

  const subtotal = calculateSubtotal();
  let total = 0;
  let ivaAmount = 0;

  if (ivaIncluido) {
    total = subtotal;
    ivaAmount = total - (total / (1 + ivaRate / 100));
  } else {
    ivaAmount = subtotal * (ivaRate / 100);
    total = subtotal + ivaAmount;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    // Generate random invoice/budget number like "2022067"
    const randomDocNum = "2026" + String(Math.floor(1000 + Math.random() * 9000));

    const nuevoDocumento = {
      tipo: "presupuesto",
      numero: randomDocNum,
      fecha: new Date().toISOString(),
      client,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        pdf: item.pdf,
        page: item.page,
        precio: item.precio,
        cantidad: item.cantidad,
        descuento: item.descuento
      })),
      moneda,
      ivaRate,
      ivaIncluido,
      ivaAmount: Math.round(ivaAmount * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(total * 100) / 100,
      notes,
      comparacion: compMoneda && tipoCambio > 0 ? {
        moneda: compMoneda,
        tipoCambio,
        totalEquivalente: Math.round(total * tipoCambio * 100) / 100
      } : null
    };

    try {
      // 1. Save to Firebase Firestore
      const docRef = await addDoc(collection(db, "documentos"), nuevoDocumento);
      
      // 2. Also append to local history for safety
      const history = JSON.parse(localStorage.getItem("visits") || "[]");
      localStorage.setItem("visits", JSON.stringify([...history, { 
        id: docRef.id, 
        date: nuevoDocumento.fecha, 
        client: nuevoDocumento.client, 
        products: items.map(p => ({ id: p.id, name: p.name })),
        documentId: docRef.id,
        documentType: "presupuesto",
        total: nuevoDocumento.total
      }]));

      // 3. Clear checkout cart
      sessionStorage.removeItem("cart");

      // 4. Redirect to print/view screen
      router.push(`/documentos/${docRef.id}`);
    } catch (error) {
      console.error("Error al guardar presupuesto:", error);
      alert("Error al conectar con la base de datos de Firebase. Por favor revisa la configuración.");
      setIsSubmitting(false);
    }
  };

  if (loading || !client) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
        <p>Cargando datos del catálogo...</p>
      </div>
    );
  }

  const getMonedaSymbol = (m: string) => {
    if (m === "USD") return "U$S";
    if (m === "EUR") return "€";
    return "$";
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: 'var(--primary)' }}>Generar Presupuesto</h1>
        <Link href="/envio" className="btn btn-outline" style={{ fontSize: '0.9rem' }}>
          ← Cancelar
        </Link>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Configuración Comercial */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>
            ⚙️ Condiciones Comerciales
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Moneda Principal</label>
              <select 
                className="input-field" 
                value={moneda} 
                onChange={(e) => setMoneda(e.target.value as any)}
                style={{ background: 'var(--bg-card)' }}
              >
                <option value="USD">Dólares (U$S)</option>
                <option value="ARS">Pesos Argentinos ($)</option>
                <option value="EUR">Euros (€)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Tasa de IVA</label>
              <select 
                className="input-field" 
                value={ivaRate} 
                onChange={(e) => setIvaRate(parseFloat(e.target.value))}
                style={{ background: 'var(--bg-card)' }}
              >
                <option value="10.5">10.5% (Tamberos / Bienes Capital)</option>
                <option value="21">21.0% (Tasa Estándar)</option>
                <option value="0">0% (Exento / Sin IVA)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={ivaIncluido} 
                  onChange={(e) => setIvaIncluido(e.target.checked)}
                  style={{ width: '1.2rem', height: '1.2rem' }}
                />
                Precios cargados incluyen IVA
              </label>
            </div>
          </div>

          <div style={{ borderTop: '1px dashed var(--border)', marginTop: '1.5rem', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--primary)' }}>Conversión Secundaria (Opcional)</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Moneda de Comparación</label>
                <select 
                  className="input-field" 
                  value={compMoneda} 
                  onChange={(e) => setCompMoneda(e.target.value as any)}
                  style={{ background: 'var(--bg-card)' }}
                >
                  <option value="">Ninguna</option>
                  <option value="ARS">Pesos Argentinos ($)</option>
                  <option value="USD">Dólares (U$S)</option>
                  <option value="EUR">Euros (€)</option>
                </select>
              </div>

              {compMoneda !== "" && (
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>
                    Tipo de Cambio (1 {moneda} = ? {compMoneda})
                  </label>
                  <input 
                    type="number" 
                    step="any"
                    className="input-field" 
                    placeholder="Ej: 950.50"
                    required
                    value={tipoCambio || ""}
                    onChange={(e) => setTipoCambio(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Carga de Precios */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1.25rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', fontSize: '1.1rem' }}>
            📝 Productos a Cotizar ({items.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {items.map((item, index) => (
              <div 
                key={item.id} 
                style={{ 
                  padding: '1.25rem', 
                  background: 'rgba(255,255,255,0.02)', 
                  borderRadius: '12px', 
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-main)' }}>{item.name}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cód: {item.id}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Precio Unitario ({getMonedaSymbol(moneda)}) *
                    </label>
                    <input 
                      type="number" 
                      step="any" 
                      min="0"
                      className="input-field" 
                      placeholder="0.00"
                      required
                      value={item.precio || ""}
                      onChange={(e) => handleItemChange(index, "precio", parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cantidad *</label>
                    <input 
                      type="number" 
                      min="1" 
                      step="1"
                      className="input-field" 
                      required
                      value={item.cantidad}
                      onChange={(e) => handleItemChange(index, "cantidad", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Descuento %</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100"
                      step="any"
                      className="input-field" 
                      value={item.descuento || ""}
                      onChange={(e) => handleItemChange(index, "descuento", parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-end', minWidth: '100px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Subtotal</span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)' }}>
                      {getMonedaSymbol(moneda)} {(item.precio * item.cantidad * (1 - item.descuento / 100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notas y Pie */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', fontSize: '1.1rem' }}>✍️ Cláusulas y Notas</h3>
            <textarea 
              className="input-field" 
              placeholder="Ej: Plazo de entrega: 45 días. Validez de la oferta: 15 días. Condición de pago: 50% anticipo, saldo contra entrega..." 
              rows={6}
              style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit', background: 'var(--bg-card)' }}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
              <span style={{ fontWeight: 600 }}>{getMonedaSymbol(moneda)} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>IVA ({ivaRate}%):</span>
              <span style={{ fontWeight: 600 }}>
                {ivaIncluido ? "(Incluido) " : ""} {getMonedaSymbol(moneda)} {ivaAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.5rem' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>Total Presupuesto:</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                {getMonedaSymbol(moneda)} {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {compMoneda !== "" && tipoCambio > 0 && (
              <div style={{ background: 'rgba(37, 211, 102, 0.05)', padding: '0.75rem', borderRadius: '8px', border: '1px solid #25D366', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: '#25D366', fontWeight: 600 }}>Equivalencia en {compMoneda}:</span>
                <span style={{ fontSize: '1.05rem', color: '#25D366', fontWeight: 700 }}>
                  {getMonedaSymbol(compMoneda)} {(total * tipoCambio).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting || items.length === 0}
          className="btn btn-primary" 
          style={{ width: '100%', padding: '1.25rem', fontSize: '1.2rem' }}
        >
          {isSubmitting ? "Guardando en Firebase..." : "💾 Guardar Presupuesto y Generar Enlace"}
        </button>
      </form>
    </div>
  );
}
