import { useEffect, useState, useRef, useCallback } from 'react';
import { WEBSOCKET_URL } from "../constants";
import { Trip } from '../type';
import { Driver, Coordinate } from '../type';
import { PaymentEventSessionCreatedData, TripEvents, ServerWsMessage, isValidWsMessage, BackendEndpoints } from '../contracts';

export function useRiderStreamConnection(location: Coordinate, userID: string) {
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [tripStatus, setTripStatus] = useState<TripEvents | null>(null);
    const [paymentSession, setPaymentSession] = useState<PaymentEventSessionCreatedData | null>(null);
    const [assignedDriver, setAssignedDriver] = useState<Trip["driver"] | null>(null);
    const [tripID, setTripID] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!userID) return;

        const ws = new WebSocket(`${WEBSOCKET_URL}${BackendEndpoints.WS_RIDERS}?userID=${userID}`);
        wsRef.current = ws;

        ws.onopen = () => {
            // Send initial location
            if (location) {
                ws.send(JSON.stringify({
                    type: TripEvents.DriverLocation,
                    data: {
                        location,
                    }
                }));
            }
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data) as ServerWsMessage;

            if (!message || !isValidWsMessage(message)) {
                setError(`Unknown message type "${message}", allowed types are: ${Object.values(TripEvents).join(', ')}`);
                return;
            }

            switch (message.type) {
                case TripEvents.DriverLocation:
                    setDrivers(message.data);
                    break;
                case TripEvents.PaymentSessionCreated:
                    setPaymentSession(message.data);
                    setTripStatus(message.type);
                    break;
                case TripEvents.DriverAssigned:
                    setAssignedDriver(message.data.driver);
                    setTripStatus(message.type);
                    setTripID(message.data.id);
                    break;
                case TripEvents.Created:
                    setTripStatus(message.type);
                    break;
                case TripEvents.NoDriversFound:
                    setTripStatus(message.type);
                    break;
            }
        };

        ws.onclose = () => {
            console.log('WebSocket closed');
        };

        ws.onerror = (event) => {
            setError('WebSocket error occurred');
            console.error('WebSocket error:', event);
        };

        return () => {
            console.log('Closing WebSocket');
            if (ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userID]);

    const resetTripStatus = () => {
        setTripStatus(null);
        setPaymentSession(null);
        setTripID(null);
    }

    const selectPaymentMethod = useCallback((method: 'card' | 'crypto', tripID: string) => {
        console.log("Selecting payment method", method, tripID);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            const eventType = method === 'card'
                ? TripEvents.PaymentSelectCard
                : TripEvents.PaymentSelectCrypto;

            wsRef.current.send(JSON.stringify({
                type: eventType,
                data: {
                    tripID,
                    userID,
                }
            }));
        }
    }, [userID]);

    return { drivers, assignedDriver, error, tripStatus, tripID, paymentSession, resetTripStatus, selectPaymentMethod };
}
