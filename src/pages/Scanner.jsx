import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import Tesseract from 'tesseract.js';
import { Camera, RefreshCw, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';

const Scanner = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImgSrc(imageSrc);
    processImage(imageSrc);
  }, [webcamRef]);

  const processImage = async (image) => {
    setLoading(true);
    setError('');
    const extractedData = { cpf: '', name: '', phone: '' };
    
    try {
      const { data: { text } } = await Tesseract.recognize(image, 'por');
      console.log("OCR Text:", text);

      // Regex para CPF
      const cpfMatch = text.match(/\d{3}\.?\d{3}\.?\d{3}-?\d{2}/);
      if (cpfMatch) extractedData.cpf = cpfMatch[0].replace(/\D/g, '');

      // Regex para Telefone (celular brasileiro)
      const phoneMatch = text.match(/(?:\(?\d{2}\)?\s?)?9\d{4}-?\d{4}/);
      if (phoneMatch) extractedData.phone = phoneMatch[0].replace(/\D/g, '');

      // Tentativa simples de pegar o nome (primeira linha que não seja rótulo ou números)
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
      const namePattern = lines.find(l => 
        !l.includes('CPF') && 
        !l.includes('Tel') && 
        !l.match(/\d/) &&
        l.length > 5
      );
      if (namePattern) extractedData.name = namePattern;

      if (extractedData.cpf || extractedData.name || extractedData.phone) {
        setResult(extractedData);
      } else {
        setError('Não conseguimos ler dados claros. Tente centralizar melhor Nome, CPF ou Telefone.');
      }
    } catch (err) {
      setError('Erro ao processar imagem.');
    }
    setLoading(false);
  };

  const handleUseResult = () => {
    const params = new URLSearchParams();
    if (result.cpf) params.append('cpf', result.cpf);
    if (result.name) params.append('name', result.name);
    if (result.phone) params.append('phone', result.phone);
    navigate(`/register?${params.toString()}`);
  };

  return (
    <div className="page-wrapper">
      <div className="header">
        <Link to="/">
          <img src={logo} alt="Casa de Bolos" className="logo-main" />
        </Link>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto', width: '100%', position: 'relative' }}>
         <div className="stamp-grey-card" style={{ padding: '1rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#333', fontWeight: '800' }}>SCANNER DE PAPEL</h2>
            
            <div style={{ position: 'relative', borderRadius: '1rem', overflow: 'hidden', background: '#000', minHeight: '300px' }}>
              {!imgSrc ? (
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "environment" }}
                  style={{ width: '100%', display: 'block' }}
                />
              ) : (
                <img src={imgSrc} style={{ width: '100%', display: 'block' }} alt="Captura" />
              )}

              {loading && (
                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'rgba(0,0,0,0.5)', 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <Loader2 className="animate-spin" size={48} />
                  <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>LENDO PAPEL...</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {!imgSrc ? (
                <button className="btn-green-pill" onClick={capture} style={{ width: 'auto', padding: '0 2rem' }}>
                  <Camera size={20} style={{ marginRight: '0.5rem' }} /> CAPTURAR
                </button>
              ) : (
                <>
                  <button className="btn-salmon-pill" onClick={() => setImgSrc(null)} style={{ width: 'auto', padding: '0 1rem' }}>
                    <RefreshCw size={20} />
                  </button>
                  {result && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                      <div style={{ background: '#f5f5f5', padding: '0.8rem', borderRadius: '0.5rem', fontSize: '0.8rem', textAlign: 'left' }}>
                        {result.name && <div>👤 <strong>Nome:</strong> {result.name}</div>}
                        {result.cpf && <div>🆔 <strong>CPF:</strong> {result.cpf}</div>}
                        {result.phone && <div>📱 <strong>Tel:</strong> {result.phone}</div>}
                      </div>
                      <button className="btn-green-pill" onClick={handleUseResult} style={{ width: '100%' }}>
                        <Check size={20} style={{ marginRight: '0.5rem' }} /> CONFIRMAR E CADASTRAR
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {error && <p style={{ color: '#b85252', marginTop: '1rem', fontWeight: 'bold' }}>{error}</p>}
            {!error && !result && imgSrc && !loading && (
              <p style={{ color: '#666', marginTop: '1rem', fontSize: '0.8rem' }}>Nenhum CPF detectado. Tente focar melhor no documento.</p>
            )}
         </div>
      </div>

      <div className="footer-section">
        <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Casa de Bolos - Scanner Inteligente</h3>
        <div className="footer-line"></div>
      </div>
    </div>
  );
};

export default Scanner;
