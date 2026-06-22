"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { numberToWords } from "../../../lib/numberToWords";

interface Product {
  id: string;
  name: string;
  description: string;
  precio: number;
  cantidad: number;
  descuento: number;
}

interface Documento {
  tipo: "presupuesto" | "proforma";
  numero: string;
  fecha: string;
  client: {
    name: string;
    email: string;
    phone: string;
    cuit: string;
    direccion: string;
    localidad: string;
    ingresosBrutos?: string;
    establishmentName?: string;
    establishmentZone?: string;
    farmSize?: string;
    sellerName?: string;
  };
  items: Product[];
  moneda: "USD" | "ARS" | "EUR";
  ivaRate: number;
  ivaIncluido: boolean;
  ivaAmount: number;
  subtotal: number;
  total: number;
  notes?: string;
  comparacion?: {
    moneda: "USD" | "ARS" | "EUR";
    tipoCambio: number;
    totalEquivalente: number;
  } | null;
}

export default function DocumentoDetalle({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const [docData, setDocData] = useState<Documento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docUrl, setDocUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setDocUrl(window.location.href);
    }

    const fetchDocument = async () => {
      try {
        const docRef = doc(db, "documentos", unwrappedParams.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDocData(docSnap.data() as Documento);
        } else {
          setError("El documento no existe en la base de datos.");
        }
      } catch (err: any) {
        console.error(err);
        setError("Error al cargar el documento desde Firebase.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [unwrappedParams.id]);

  if (loading) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)" }}>
        <p>Cargando documento comercial...</p>
      </div>
    );
  }

  if (error || !docData) {
    return (
      <div style={{ padding: "4rem", textAlign: "center" }}>
        <p style={{ color: "#ff6b6b" }}>{error || "Documento no encontrado."}</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: "1rem" }}>
          Volver al Inicio
        </Link>
      </div>
    );
  }

  const getMonedaSymbol = (m: string) => {
    if (m === "USD") return "U$S";
    if (m === "EUR") return "€";
    return "$";
  };

  // Generate WhatsApp message
  const handleWhatsApp = () => {
    const isBudget = docData.tipo === "presupuesto";
    const docName = isBudget ? "Presupuesto" : "Factura Proforma";
    
    let text = `Hola ${docData.client.name},\n\n`;
    text += `Te compartimos el *${docName} Nº ${docData.numero}* de Dairy Solutions SRL por los productos solicitados.\n\n`;
    text += `Puedes ver el documento oficial, imprimirlo o descargarlo en PDF desde el siguiente enlace:\n🔗 ${docUrl}\n\n`;
    text += `Quedamos a tu disposición.\n\nSaludos,\nEl equipo de Dairy Solutions`;

    let cleanPhone = docData.client.phone?.replace(/[\s\+\-]/g, '') || '';
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) {
      cleanPhone = '549' + cleanPhone;
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('9')) {
      cleanPhone = '54' + cleanPhone;
    } else if (cleanPhone.length === 11 && !cleanPhone.startsWith('54')) {
      cleanPhone = '549' + cleanPhone.substring(cleanPhone.startsWith('0') ? 1 : 0);
    }

    const wpLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(wpLink, '_blank');
  };

  // Generate Email message with BCC to dairy@dairy.com.ar
  const handleEmail = () => {
    const isBudget = docData.tipo === "presupuesto";
    const docName = isBudget ? "Presupuesto" : "Factura Proforma";
    
    const subject = `${docName} Nº ${docData.numero} - Dairy Solutions`;
    
    let body = `Hola ${docData.client.name},\n\n`;
    body += `Le adjuntamos el enlace para acceder al ${docName} comercial Nº ${docData.numero} de Dairy Solutions SRL:\n\n`;
    body += `${docUrl}\n\n`;
    body += `Detalle del total: ${getMonedaSymbol(docData.moneda)} ${docData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}\n\n`;
    body += `Cualquier consulta estamos a su disposición.\n\nAtentamente,\nEl equipo de Dairy Solutions\nSadi Carnot 2390, Grand Bourg`;

    const mailto = `mailto:${docData.client.email}?bcc=dairy@dairy.com.ar&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const totalGridRows = 12;
  const emptyRowsCount = Math.max(0, totalGridRows - docData.items.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem 0', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Control panel - hidden during print */}
      <div className="no-print glass-panel" style={{ padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
          {docData.tipo === "presupuesto" ? "📄 Presupuesto" : "🧾 Proforma"} Generado con éxito
        </span>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="btn btn-primary" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
            🖨️ Imprimir / Guardar PDF
          </button>
          <button onClick={handleWhatsApp} className="btn btn-outline" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', background: '#25D366', color: 'white', border: 'none' }}>
            📱 Enviar WhatsApp
          </button>
          <button onClick={handleEmail} className="btn btn-outline" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}>
            📧 Enviar Email (con copia)
          </button>
          <Link href="/" className="btn btn-outline" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
            🏠 Inicio
          </Link>
        </div>
      </div>

      {/* Spreadsheet page sheet layout */}
      <div className="sheet-container" style={{
        background: 'white',
        color: '#000',
        padding: '2rem',
        fontFamily: '"Courier New", Courier, monospace, Arial, sans-serif',
        fontSize: '0.85rem',
        border: '1px solid #ccc',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {/* CSS rules for printing */}
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            .no-print { display: none !important; }
            body { background: white !important; color: black !important; padding: 0 !important; margin: 0 !important; }
            .sheet-container { 
              border: none !important; 
              box-shadow: none !important; 
              max-width: 100% !important; 
              width: 100% !important; 
              padding: 0 !important; 
              margin: 0 !important; 
            }
          }
          .sheet-table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
          .sheet-table th, .sheet-table td { border: 1px solid #000; padding: 6px 8px; text-align: left; }
          .sheet-table th { font-weight: bold; background: #f2f2f2; }
          .border-bottom-none { border-bottom: none !important; }
          .border-top-none { border-top: none !important; }
          .border-left-none { border-left: none !important; }
          .border-right-none { border-right: none !important; }
        `}} />

        {/* Header Grid */}
        <table className="sheet-table" style={{ marginTop: 0 }}>
          <tbody>
            <tr>
              <td style={{ width: '60%', verticalAlign: 'top', borderRight: 'none' }} className="border-bottom-none">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo-dairy.png" alt="Dairy Solutions Logo" style={{ height: '45px', objectFit: 'contain' }} />
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold', fontFamily: 'sans-serif' }}>Dairy Solutions</h2>
                    <span style={{ fontSize: '0.75rem', fontWeight: 'bold', fontStyle: 'italic' }}>Dairy Solutions SRL</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', lineHeight: '1.3' }}>
                  Sadi Carnot 2390, 1615 Grand Bourg<br />
                  CUIT: 30-70911771-4
                </div>
              </td>
              <td style={{ width: '40%', verticalAlign: 'top', borderLeft: 'none' }} className="border-bottom-none">
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 'bold', textTransform: 'capitalize', textAlign: 'right' }}>
                  {docData.tipo === "presupuesto" ? "Presupuesto" : "Factura Proforma"}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem', textAlign: 'right', alignItems: 'flex-end' }}>
                  <div><strong>Nº:</strong> {docData.numero}</div>
                  <div><strong>Fecha:</strong> {new Date(docData.fecha).toLocaleDateString('es-AR')}</div>
                  <div><strong>C.U.I.T:</strong> 30-70911771-4</div>
                  <div><strong>Ing Brutos:</strong> Convenio Multilateral</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Client details Grid */}
        <table className="sheet-table" style={{ marginTop: '-1px' }}>
          <tbody>
            <tr>
              <td style={{ width: '60%', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div><strong>Razón Social:</strong> {docData.client.name}</div>
                  <div><strong>Dirección:</strong> {docData.client.direccion}</div>
                  <div><strong>Localidad:</strong> {docData.client.localidad}</div>
                </div>
              </td>
              <td style={{ width: '40%', verticalAlign: 'top' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <div><strong>C.U.I.T:</strong> {docData.client.cuit}</div>
                  <div><strong>Ing Brutos:</strong> {docData.client.ingresosBrutos || "No Informado"}</div>
                  {docData.client.phone && <div><strong>WhatsApp:</strong> {docData.client.phone}</div>}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Items Grid Table */}
        <table className="sheet-table" style={{ marginTop: '-1px' }}>
          <thead>
            <tr>
              <th style={{ width: '15%', textAlign: 'center' }}>Código</th>
              <th style={{ width: '50%' }}>Descripción</th>
              <th style={{ width: '13%', textAlign: 'right' }}>{getMonedaSymbol(docData.moneda)} Precio</th>
              <th style={{ width: '9%', textAlign: 'center' }}>Cant.</th>
              <th style={{ width: '13%', textAlign: 'right' }}>{getMonedaSymbol(docData.moneda)} Total</th>
            </tr>
          </thead>
          <tbody>
            {docData.items.map(item => {
              const itemTotal = item.precio * item.cantidad * (1 - item.descuento / 100);
              return (
                <tr key={item.id}>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{item.id.substring(0, 10)}</td>
                  <td>
                    <strong>{item.name}</strong>
                    {item.description && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: '#333', marginTop: '2px' }}>
                        {item.description.substring(0, 120)}...
                      </span>
                    )}
                    {item.descuento > 0 && (
                      <span style={{ fontSize: '0.7rem', color: '#ff6b6b', fontStyle: 'italic', display: 'block' }}>
                        (Descuento del {item.descuento}% aplicado)
                      </span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{item.precio.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'monospace' }}>{item.cantidad}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              );
            })}

            {emptyRows.map((_, i) => (
              <tr key={`empty-${i}`} style={{ height: '24px' }}>
                <td style={{ borderBottom: i === emptyRowsCount - 1 ? '1px solid #000' : '1px solid #eee' }}></td>
                <td style={{ borderBottom: i === emptyRowsCount - 1 ? '1px solid #000' : '1px solid #eee' }}></td>
                <td style={{ borderBottom: i === emptyRowsCount - 1 ? '1px solid #000' : '1px solid #eee' }}></td>
                <td style={{ borderBottom: i === emptyRowsCount - 1 ? '1px solid #000' : '1px solid #eee' }}></td>
                <td style={{ borderBottom: i === emptyRowsCount - 1 ? '1px solid #000' : '1px solid #eee' }}></td>
              </tr>
            ))}

            <tr>
              <td colSpan={3} rowSpan={3} style={{ verticalAlign: 'top', padding: '10px' }}>
                <div style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.8rem', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  {numberToWords(docData.total, docData.moneda)}
                </div>
                <div style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                  {docData.ivaIncluido ? "Este precio incluye el IVA" : "Precios más IVA"}
                </div>
              </td>
              <td style={{ fontWeight: 'bold', textAlign: 'right' }}>Subtotal</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>
                {getMonedaSymbol(docData.moneda)} {docData.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td style={{ textAlign: 'right' }}>IVA ({docData.ivaRate}%)</td>
              <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                {docData.ivaIncluido ? "" : "+"} {getMonedaSymbol(docData.moneda)} {docData.ivaAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', background: '#f2f2f2', textAlign: 'right' }}>Total</td>
              <td style={{ textAlign: 'right', fontWeight: 'bold', background: '#f2f2f2', fontFamily: 'monospace' }}>
                {getMonedaSymbol(docData.moneda)} {docData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Secondary Currency Conversion footer */}
        {docData.comparacion && (
          <div style={{ 
            marginTop: '0.5rem', 
            padding: '8px 12px', 
            border: '1px solid #000', 
            background: '#fafafa', 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            fontWeight: 'bold'
          }}>
            <span>Cambio de Referencia ({docData.comparacion.moneda}):</span>
            <span>1 {docData.moneda} = {getMonedaSymbol(docData.comparacion.moneda)} {docData.comparacion.tipoCambio}</span>
            <span>Total Equivalente: {getMonedaSymbol(docData.comparacion.moneda)} {docData.comparacion.totalEquivalente.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        {/* Notes and Signature Area */}
        <div style={{ display: 'flex', marginTop: '0.5rem', gap: '1rem', minHeight: '125px' }}>
          {/* Notes */}
          <div style={{ flex: '1.8', border: '1px solid #000', padding: '8px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column' }}>
            <strong>Notas y condiciones comerciales:</strong>
            <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
              {docData.notes || "Garantía de fábrica incluida. Plazo de entrega a convenir. Repuestos legítimos BouMatic."}
            </p>
          </div>

          {/* Signature */}
          <div style={{ flex: '1.2', border: '1px solid #000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: '8px', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '10px', width: '85%', height: '55px', opacity: 0.9 }}>
              <svg viewBox="0 0 200 60" style={{ width: '100%', height: '100%' }}>
                <path d="M 15 35 Q 35 15, 60 30 T 110 25 T 160 20 T 180 30 Q 140 45, 90 40 T 30 35" fill="none" stroke="#0033cc" strokeWidth="2.5" />
                <path d="M 50 15 L 75 45 M 100 10 L 115 50" fill="none" stroke="#0033cc" strokeWidth="2" />
              </svg>
            </div>
            
            <div style={{ width: '85%', borderTop: '1px dashed #666', textAlign: 'center', paddingTop: '6px', fontSize: '0.75rem', lineHeight: '1.2' }}>
              <strong style={{ color: '#0033cc' }}>Dairy Solutions SRL</strong><br />
              <span style={{ color: '#555', fontSize: '0.65rem' }}>Firma Autorizada</span>
            </div>
          </div>
        </div>

        {/* Footer legal text */}
        <div style={{ textAlign: 'center', fontSize: '0.65rem', color: '#666', marginTop: '0.5rem' }}>
          Dairy Solutions SRL - CUIT: 30-70911771-4 - Dirección: Sadi Carnot 2390, Grand Bourg, Buenos Aires.
        </div>
      </div>
    </div>
  );
}