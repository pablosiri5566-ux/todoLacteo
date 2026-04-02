"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  description: string;
  pdf: string;
  page: number;
}

export default function Productos() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [productsData, setProductsData] = useState<Product[]>([]);

  useEffect(() => {
    // Load products via fetch from public folder (allowing PWA caching later)
    // Load products via fetch from public folder with cache-buster
    fetch(`/data/products.json?v=${Date.now()}`)
      .then(res => res.json())
      .then(data => setProductsData(data))
      .catch(err => console.error("Error loading catalogue:", err));
      
    // Load existing cart if navigating back from Envío
    const savedCart = sessionStorage.getItem("cart");
    if (savedCart) {
      setSelectedProducts(new Set(JSON.parse(savedCart)));
    }
  }, []);

  const filteredProducts = productsData.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleProduct = (id: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedProducts(newSet);
  };

  const handeCheckout = () => {
    sessionStorage.setItem("cart", JSON.stringify(Array.from(selectedProducts)));
    router.push("/envio");
  };

  return (
    <div className="animate-fade-in" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: 'var(--primary)' }}>Catálogo de Productos</h1>
        {selectedProducts.size > 0 && (
          <button onClick={handeCheckout} className="btn btn-primary animate-fade-in" style={{ fontSize: '0.9rem' }}>
            Enviar [{selectedProducts.size}]
          </button>
        )}
      </div>

      <input 
        type="search" 
        className="input-field" 
        placeholder="Buscar productos, características o palabras clave..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ marginBottom: '2rem', fontSize: '1.05rem', padding: '1rem', borderTop: '2px solid transparent', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {filteredProducts.map(product => (
          <div key={product.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.15rem', color: 'var(--text-main)', lineHeight: '1.3' }}>{product.name}</h3>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flexGrow: 1, marginBottom: '1.25rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {product.description || "Sin descripción adicional..."}
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto' }}>
              <Link 
                href={`/productos/${product.id}`} 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '0.5rem', fontSize: '0.9rem' }}
              >
                📄 Ver Ficha
              </Link>
              <button 
                onClick={() => toggleProduct(product.id)}
                className={`btn ${selectedProducts.has(product.id) ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
              >
                {selectedProducts.has(product.id) ? '✓ En Bandeja' : '+ Agregar'}
              </button>
            </div>
          </div>
        ))}
        {filteredProducts.length === 0 && searchTerm !== "" && (
          <p style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '3rem', color: 'var(--text-muted)' }}>
            No se encontraron productos coincidentes con "{searchTerm}".
          </p>
        )}
        {productsData.length === 0 && (
          <p style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '3rem', color: 'var(--text-muted)' }}>
            Cargando catálogo inteligente...
          </p>
        )}
      </div>
    </div>
  );
}
