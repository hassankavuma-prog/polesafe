'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { SafetyIncident } from '../../../lib/safety-ops/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

type SafetySocketState = {
  socket: Socket | null;
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'reconnecting' | 'offline';
  liveIncidents: SafetyIncident[];
  latestEmergency: SafetyIncident | null;
  lastSocketEvent: string | null;
  clearLatestEmergency: () => void;
};

export function useSafetySocket(): SafetySocketState {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<SafetySocketState['connectionState']>('connecting');
  const [liveIncidents, setLiveIncidents] = useState<SafetyIncident[]>([]);
  const [latestEmergency, setLatestEmergency] = useState<SafetyIncident | null>(null);
  const [lastSocketEvent, setLastSocketEvent] = useState<string | null>(null);
  const lastEmergencyIdRef = useRef<string | null>(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 8000,
    });

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
      setLastSocketEvent('Connected to dispatcher feed');
      lastEmergencyIdRef.current = null;
      socketInstance.emit('join_dispatcher_room');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnectionState('offline');
      setLastSocketEvent('Socket disconnected');
    };

    const handleReconnect = () => {
      setIsConnected(true);
      setConnectionState('connected');
      setLastSocketEvent('Socket reconnected');
    };

    const handleReconnectAttempt = () => {
      setConnectionState('reconnecting');
      setLastSocketEvent('Reconnecting to dispatcher feed');
    };

    const handleConnectError = () => {
      setIsConnected(false);
      setConnectionState('offline');
      setLastSocketEvent('Socket connection error');
    };

    const handleIncidentCreated = (incident: SafetyIncident) => {
      setLiveIncidents((prev) => {
        const next = [incident, ...prev.filter((item) => item._id !== incident._id)];
        return next.slice(0, 100);
      });
      setLastSocketEvent(`Incident created: ${incident.incidentNumber || incident._id}`);

      if (incident.severity === 'high' || incident.severity === 'critical') {
        if (lastEmergencyIdRef.current !== incident._id) {
          lastEmergencyIdRef.current = incident._id;
          setLatestEmergency(incident);
        }
      }
    };

    const handleIncidentUpdated = (updatedIncident: SafetyIncident) => {
      setLiveIncidents((prev) =>
        prev.map((incident) => (incident._id === updatedIncident._id ? updatedIncident : incident)),
      );
      setLastSocketEvent(`Incident updated: ${updatedIncident.incidentNumber || updatedIncident._id}`);

      if (updatedIncident.severity === 'high' || updatedIncident.severity === 'critical') {
        if (lastEmergencyIdRef.current !== updatedIncident._id) {
          lastEmergencyIdRef.current = updatedIncident._id;
          setLatestEmergency(updatedIncident);
        }
      }
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('reconnect', handleReconnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('reconnect_attempt', handleReconnectAttempt);
    socketInstance.on('incident_created', handleIncidentCreated);
    socketInstance.on('incident_updated', handleIncidentUpdated);
    setConnectionState('connecting');
    socketInstance.connect();
    
    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('reconnect', handleReconnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('reconnect_attempt', handleReconnectAttempt);
      socketInstance.off('incident_created', handleIncidentCreated);
      socketInstance.off('incident_updated', handleIncidentUpdated);
      socketInstance.disconnect();
    };
  }, []);

  return {
    socket,
    isConnected,
    connectionState,
    liveIncidents,
    latestEmergency,
    lastSocketEvent,
    clearLatestEmergency: () => {
      lastEmergencyIdRef.current = null;
      setLatestEmergency(null);
    },
  };
}
