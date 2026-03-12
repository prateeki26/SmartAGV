import React, { createContext, useState, useEffect, useRef, useContext } from 'react';

const SerialContext = createContext();

export const SerialProvider = ({ children }) => {
  const [videoUrl, setVideoUrl] = useState(null);
  const [wsCamConnected, setWsCamConnected] = useState(false);
  const [wsCmdConnected, setWsCmdConnected] = useState(false);
  
  const [serialConnected, setSerialConnected] = useState(false);
  const [serialData, setSerialData] = useState({
    U: null,
    B: null,
    IR: null,
    IL: null,
  });

  const portRef = useRef(null);
  const readerRef = useRef(null);
  const readerClosedRef = useRef(null);
  const wsCamRef = useRef(null);
  const wsCmdRef = useRef(null);
  const videoUrlRef = useRef(null);

  useEffect(() => {
    const connectCamera = () => {
      const ws = new WebSocket('ws://192.168.4.1/Camera');
      ws.binaryType = 'blob';
      
      ws.onopen = () => setWsCamConnected(true);
      
      ws.onmessage = (event) => {
        if (event.data instanceof Blob) {
          if (videoUrlRef.current) {
            URL.revokeObjectURL(videoUrlRef.current);
          }
          const newUrl = URL.createObjectURL(event.data);
          videoUrlRef.current = newUrl;
          setVideoUrl(newUrl);
        }
      };
      
      ws.onclose = () => {
        setWsCamConnected(false);
        setTimeout(connectCamera, 3000);
      };
      
      wsCamRef.current = ws;
    };
    
    connectCamera();
    
    return () => {
      if (wsCamRef.current) wsCamRef.current.close();
      if (videoUrlRef.current) URL.revokeObjectURL(videoUrlRef.current);
    };
  }, []);

  useEffect(() => {
    const connectCommand = () => {
      const ws = new WebSocket('ws://192.168.4.1/CarInput');
      
      ws.onopen = () => setWsCmdConnected(true);
      ws.onclose = () => {
        setWsCmdConnected(false);
        setTimeout(connectCommand, 3000);
      };
      
      wsCmdRef.current = ws;
    };
    
    connectCommand();
    
    return () => {
      if (wsCmdRef.current) wsCmdRef.current.close();
    };
  }, []);

  const sendCommand = (key, value) => {
    if (wsCmdRef.current && wsCmdRef.current.readyState === WebSocket.OPEN) {
      wsCmdRef.current.send(`${key},${value}`);
    } else {
      console.warn('Command WebSocket is not connected.');
    }
  };

  class LineBreakTransformer {
    constructor() {
      this.chunks = "";
    }
    transform(chunk, controller) {
      this.chunks += chunk;
      const lines = this.chunks.split("\n");
      this.chunks = lines.pop();
      lines.forEach((line) => controller.enqueue(line));
    }
    flush(controller) {
      if (this.chunks !== "") {
        controller.enqueue(this.chunks);
      }
    }
  }

  const connectSerial = async () => {
    if (!('serial' in navigator)) {
       console.error("Web Serial API not supported in this browser.");
       return;
    }
    try {
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setSerialConnected(true);

      const textDecoder = new TextDecoderStream();
      readerClosedRef.current = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.pipeThrough(new TransformStream(new LineBreakTransformer())).getReader();
      readerRef.current = reader;

      readLoop(reader);
    } catch (err) {
      console.error("Serial connection error:", err);
    }
  };

  const readLoop = async (reader) => {
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          const parts = value.trim().split(':');
          if (parts.length === 2) {
            const tag = parts[0];
            const val = parts[1];
            setSerialData(prev => ({ ...prev, [tag]: val }));
          }
        }
      }
    } catch (error) {
      console.error("Error reading from serial port:", error);
    } finally {
      reader.releaseLock();
    }
  };

  const disconnectSerial = async () => {
    try {
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      if (readerClosedRef.current) {
        await readerClosedRef.current.catch(() => {});
        readerClosedRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
      setSerialConnected(false);
    } catch (err) {
      console.error("Error disconnecting serial:", err);
    }
  };

  return (
    <SerialContext.Provider value={{
      videoUrl,
      wsCamConnected,
      wsCmdConnected,
      sendCommand,
      serialConnected,
      serialData,
      connectSerial,
      disconnectSerial
    }}>
      {children}
    </SerialContext.Provider>
  );
};

export const useSerial = () => useContext(SerialContext);
