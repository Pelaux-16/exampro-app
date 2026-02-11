// src/components/Footer.js
import React from 'react';

function Footer() {
  return (
    <footer style={{
      backgroundColor: '#111827',
      color: '#d1d5db',
      padding: '1.5rem 0',
      width: '100%',
      textAlign: 'center'
    }}>
      <div style={{ width: '100%' }}>
        <p style={{ fontSize: '0.875rem', margin: '0.5rem 0' }}>
          Power by <span style={{ fontWeight: '600', color: 'white' }}>Grinóvero Edgardo</span> © 2026
        </p>
        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'white', margin: '0.5rem 0' }}>
          División Instrucción y Capacitación
        </p>
        <p style={{ fontSize: '0.875rem', fontWeight: '500', color: 'white', margin: '0.5rem 0' }}>
          Policía de Entre Ríos
        </p>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '0.75rem 0 0 0' }}>
          Todos los derechos reservados
        </p>
      </div>
    </footer>
  );
}

export default Footer;