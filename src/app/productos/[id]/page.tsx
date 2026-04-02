"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string;
  pdf: string;
  page: number;
}

export default function FichaProducto({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      return /android|iphone|ipad|ipod/i.test(userAgent.toLowerCase());
    };
    setIsMobile(checkMobile());

    // Add cache-buster to ensure the latest JSON data
    fetch(`/data/products.json?v=${Date.now()}`)
      .then(res => res.json())
      .then((data: Product[]) => {
        // Find product by id (ensure comparison is clean)
        const found = data.find(p => p.id.trim() === unwrappedParams.id.trim());
        if (found) setProduct(found);
      })
      .catch(err => console.error("Error fetching product:", err));
  }, [unwrappedParams.id]);

  if (!product) {
    return (
      <div className="container animate-fade-in" style={{ padding: '4rem 0', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>Cargando ficha del producto...</p>
      </div>
    );
  }

  const addToCart = () => {
    const savedCart = sessionStorage.getItem("cart");
    const cart = savedCart ? new Set<string>(JSON.parse(savedCart)) : new Set<string>();
    cart.add(product.id);
    sessionStorage.setItem("cart", JSON.stringify(Array.from(cart)));
    router.push("/productos"); // return to catalog
  };

  return (
    <div className="animate-fade-in" style={{ padding: '1.5rem 0', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <Link href="/productos" className="btn btn-outline" style={{ padding: '0.6rem 1rem', fontSize: '0.9rem' }}>
          ← Volver
        </Link>
        <button onClick={addToCart} className="btn btn-primary" style={{ marginLeft: 'auto', padding: '0.6rem 1.5rem' }}>
          + Agregar a la Bandeja
        </button>
      </div>

      {isMobile && (
        <div style={{ background: 'rgba(255, 193, 7, 0.1)', borderLeft: '4px solid #ffc107', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            <strong>Nota Móvil:</strong> Si el visor no muestra la página correcta, usa este botón:
          </p>
          <a 
            href={`/pdfs/${product.pdf}?v=${Date.now()}#page=${product.page}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="btn btn-primary"
            style={{ display: 'inline-block', marginTop: '0.75rem', fontSize: '0.9rem', padding: '0.75rem 1.25rem', background: 'var(--primary-hover)', textDecoration: 'none' }}
          >
            📄 Abrir Ficha PDF (Página {product.page})
          </a>
        </div>
      )}

      <div className="glass-panel" style={{ flexGrow: 1, padding: '1rem', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '1.25rem', color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 700 }}>{product.name}</h2>
        
        {/* Info Técnica Textual (Garantiza info correcta en móviles si falla el PDF) */}
        <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1.25rem', borderRadius: 'var(--radius)', borderLeft: '3px solid var(--primary)' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Descripción Técnica</h4>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-main)', lineHeight: '1.6' }}>{product.description || "Consultar detalles técnicos adicionales en el archivo PDF adjunto."}</p>
        </div>
        
        <div style={{ flexGrow: 1, position: 'relative', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          {/* The PDF viewer automatically opens the required page because of `#page=${product.page}` */}
          <iframe 
            src={`/pdfs/${product.pdf}#page=${product.page}&toolbar=0&navpanes=0&scrollbar=0`} 
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', background: '#e0e0e0' }}
            title={`Ficha PDF de ${product.name}`}
          />
        </div>
        
        <div style={{ marginTop: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Documento Fuente: {product.pdf} (Página {product.page})</p>
        </div>
      </div>
    </div>
  );
}
