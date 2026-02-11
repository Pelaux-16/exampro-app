// src/components/Footer.js
import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-2 w-full">
      <div className="w-full px-4">
        <div className="text-center">
          <p className="text-xs">
            Power by <span className="font-semibold text-white">Grinóvero Edgardo</span> © 2026
          </p>
          <p className="text-xs font-medium text-white">
            División Instrucción y Capacitación
          </p>
          <p className="text-xs font-medium text-white">
            Policía de Entre Ríos
          </p>
          <p className="text-xs text-gray-400">
            Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;