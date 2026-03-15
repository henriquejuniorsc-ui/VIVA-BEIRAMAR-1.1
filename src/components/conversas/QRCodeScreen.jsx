import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, RefreshCw, Smartphone, Wifi } from 'lucide-react';

export default function QRCodeScreen({ uazFetch, onConnected }) {
  const [qrData, setQrData] = useState(null);
  const [qrType, setQrType] = useState(null); // 'base64' | 'string'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchQR = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await uazFetch('/instance/qrcode');
      const qr = data?.qrcode || data?.qr || data?.base64 || data?.code || '';

      if (!qr) {
        setError('QR Code não disponível. Tente atualizar.');
        return;
      }

      // Detect type: if starts with data: or has long base64 string → base64 image
      if (qr.startsWith('data:image') || qr.length > 500) {
        setQrType('base64');
        setQrData(qr.startsWith('data:') ? qr : `data:image/png;base64,${qr}`);
      } else {
        // It's a string to render as QR code
        setQrType('string');
        setQrData(qr);
      }
    } catch (e) {
      setError('Não foi possível carregar o QR Code. Verifique as configurações da UAZAPI.');
      console.error('QR fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll status every 5 seconds
  useEffect(() => {
    fetchQR();

    pollRef.current = setInterval(async () => {
      try {
        const data = await uazFetch('/instance/status');
        const connected = !!(data?.connected || data?.state === 'open' || data?.instance?.state === 'open');
        if (connected) {
          clearInterval(pollRef.current);
          onConnected();
        }
      } catch (e) { /* keep polling */ }
    }, 5000);

    return () => clearInterval(pollRef.current);
  }, []);

  return (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center p-4 bg-[#FAF8F5]">
      <div className="bg-white rounded-2xl shadow-lg border border-[#E8E2D8] p-8 max-w-md w-full text-center">
        {/* WhatsApp icon */}
        <div className="w-16 h-16 bg-[#25D366]/10 rounded-full flex items-center justify-center mx-auto mb-5">
          <Smartphone className="w-8 h-8 text-[#25D366]" />
        </div>

        <h2 className="text-xl font-bold font-serif text-[#1B2B3A] mb-2">Conecte seu WhatsApp</h2>
        <p className="text-sm text-[#8A8A8A] mb-6">Escaneie o QR Code com o WhatsApp do celular</p>

        {/* QR Code area */}
        <div className="bg-white border border-[#E8E2D8] rounded-xl p-6 mx-auto w-fit mb-6 min-h-[272px] flex items-center justify-center">
          {isLoading ? (
            <div className="w-[240px] h-[240px] flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#C4A265]" />
            </div>
          ) : error ? (
            <div className="w-[240px] h-[240px] flex flex-col items-center justify-center">
              <Wifi className="w-8 h-8 text-red-300 mb-2" />
              <p className="text-xs text-red-400 text-center">{error}</p>
            </div>
          ) : qrType === 'base64' ? (
            <img src={qrData} alt="QR Code" className="w-[240px] h-[240px]" />
          ) : (
            <QRCodeSVG value={qrData} size={240} level="M" />
          )}
        </div>

        {/* Instructions */}
        <div className="text-left bg-[#FAF8F5] rounded-xl p-4 mb-4">
          <p className="text-xs text-[#1B2B3A] font-medium mb-2">Como conectar:</p>
          <ol className="text-xs text-[#8A8A8A] space-y-1.5">
            <li>1. Abra o WhatsApp no celular</li>
            <li>2. Toque em <strong>Menu ⋮</strong> ou <strong>Configurações</strong></li>
            <li>3. Toque em <strong>Dispositivos conectados</strong></li>
            <li>4. Toque em <strong>Conectar um dispositivo</strong></li>
            <li>5. Aponte a câmera para este QR Code</li>
          </ol>
        </div>

        {/* Refresh button */}
        <button
          onClick={fetchQR}
          disabled={isLoading}
          className="px-4 py-2.5 border border-[#C4A265] text-[#C4A265] rounded-xl text-sm font-medium hover:bg-[#C4A265] hover:text-white transition-all flex items-center gap-2 mx-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar QR Code
        </button>

        {/* Status indicator */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-[#8A8A8A]">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          Aguardando conexão...
        </div>
      </div>
    </div>
  );
}
