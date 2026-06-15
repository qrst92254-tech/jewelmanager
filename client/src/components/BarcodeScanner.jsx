import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const BarcodeScanner = ({ onResult, onClose }) => {
    const scannerRef = useRef(null);

    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            'barcode-reader',
            {
                fps: 10,
                qrbox: { width: 250, height: 120 },
                formatsToSupport: [0],
                rememberLastUsedCamera: true
            },
            false
        );

        scanner.render(
            (decodedText) => {
                scanner.clear().catch(() => {});
                onResult(decodedText);
            },
            (error) => {
                // scan errors are normal — ignore them
            }
        );

        scannerRef.current = scanner;

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(() => {});
            }
        };
    }, [onResult]);

    return <div id="barcode-reader" style={{ width: '100%' }} />;
};

export default BarcodeScanner;
