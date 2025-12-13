import { RouteFare, TripPreview, Driver } from "../type"
import { useState } from 'react';
import { DriverList } from './DriversList';
import { Card } from "./ui/card"
import { Button } from "./ui/button"
import { convertMetersToKilometers, convertSecondsToMinutes } from "../utils/math"
import { Skeleton } from "./ui/skeleton"
import { TripOverviewCard } from './TripOverviewCard';
import { StripePaymentButton } from "./StripePaymentButton"
import { DriverCard } from './DriverCard'
import { TripEvents, PaymentEventSessionCreatedData } from "../contracts"
import { CryptoPaymentView } from "./CryptoPaymentView";

interface TripOverviewProps {
  trip: TripPreview | null;
  status: TripEvents | null;
  tripID?: string | null;
  assignedDriver?: Driver | null;
  paymentSession?: PaymentEventSessionCreatedData | null;
  onPackageSelect: (carPackage: RouteFare) => void;
  onCancel: () => void;
  onSelectPaymentMethod: (method: 'card' | 'crypto', tripID: string) => void;
}

export const RiderTripOverview = ({
  trip,
  status,
  tripID,
  assignedDriver,
  paymentSession,
  onPackageSelect,
  onCancel,
  onSelectPaymentMethod,
}: TripOverviewProps) => {
  const [activePaymentMethod, setActivePaymentMethod] = useState<'card' | 'crypto' | null>(null);

  if (!trip) {
    return (
      <TripOverviewCard
        title="Start a trip"
        description="Click on the map to set a destination"
      />
    )
  }

  if (status === TripEvents.PaymentSessionCreated && paymentSession) {
    return (
      <TripOverviewCard
        title="Payment Required"
        description="Please complete the payment to confirm your trip"
      >
        <div className="flex flex-col gap-4">
          <DriverCard driver={assignedDriver} />

          <div className="text-sm text-gray-500">
            <p>Amount: {paymentSession.amount} {paymentSession.currency}</p>
            <p>Trip ID: {paymentSession.tripID}</p>
          </div>
          <StripePaymentButton paymentSession={paymentSession} />
        </div>
      </TripOverviewCard>
    )
  }

  if (status === TripEvents.NoDriversFound) {
    return (
      <TripOverviewCard
        title="No drivers found"
        description="No drivers found for your trip, please try again later"
      >
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Go back
        </Button>
      </TripOverviewCard>
    )
  }

  if (status === TripEvents.DriverAssigned) {
    return (
      <TripOverviewCard
        title="Driver assigned!"
        description="Choose your payment method to confirm the trip"
      >
        <div className="flex flex-col space-y-4">
          {/* Driver Info */}
          <DriverCard driver={assignedDriver} />

          {/* Payment Method Selection */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Select Payment Method</h4>

            {/* Card Payment Option */}
            <button
              className={`flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 group relative overflow-hidden ${activePaymentMethod === 'card'
                ? 'border-blue-500 bg-blue-50 cursor-wait'
                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                } ${activePaymentMethod && activePaymentMethod !== 'card' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!!activePaymentMethod}
              onClick={() => {
                console.log("Selecting card payment method", tripID);
                if (tripID) {
                  setActivePaymentMethod('card');
                  onSelectPaymentMethod('card', tripID);
                }
              }}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${activePaymentMethod === 'card' ? 'bg-blue-200' : 'bg-blue-100 group-hover:bg-blue-200'
                }`}>
                {activePaymentMethod === 'card' ? (
                  <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                )}
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium text-gray-900">
                  {activePaymentMethod === 'card' ? 'Processing...' : 'Pay with Card'}
                </span>
                <span className="text-sm text-gray-500">Credit or debit card via Stripe</span>
              </div>
              {!activePaymentMethod && (
                <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>

            {/* Crypto Payment Option */}
            <button
              className={`flex items-center gap-4 p-4 border rounded-lg transition-all duration-200 group relative overflow-hidden ${activePaymentMethod === 'crypto'
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                } ${activePaymentMethod && activePaymentMethod !== 'crypto' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={!!activePaymentMethod}
              onClick={() => {
                console.log('Crypto payment selected');
                setActivePaymentMethod('crypto');
              }}
            >
              <div className={`flex items-center justify-center w-12 h-12 rounded-full transition-colors ${activePaymentMethod === 'crypto' ? 'bg-purple-200' : 'bg-purple-100 group-hover:bg-purple-200'
                }`}>
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium text-gray-900">
                  Pay with Crypto
                </span>
                <span className="text-sm text-gray-500">USDC via x402 protocol</span>
              </div>
              {!activePaymentMethod && (
                <svg className="w-5 h-5 text-gray-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </button>
          </div>

          {activePaymentMethod === 'crypto' && (
            <div className="mt-4 border-t pt-4">
              <CryptoPaymentView
                amount={((trip?.rideFares?.[0]?.totalPriceInCents || 0) / 100).toFixed(2)}
                currency="USDC"
                tripID={tripID || undefined}
                onPay={() => {
                  if (tripID) {
                    onSelectPaymentMethod('crypto', tripID);
                  }
                }}
                onCancel={() => setActivePaymentMethod(null)}
                isLoading={false}
              />
            </div>
          )}

          {/* Cancel Button */}
          {activePaymentMethod !== 'crypto' && (
            <Button variant="outline" className="w-full mt-2" onClick={onCancel}>
              Cancel Trip
            </Button>
          )}
        </div>
      </TripOverviewCard>
    )
  }

  if (status === TripEvents.Completed) {
    return (
      <TripOverviewCard
        title="Trip completed!"
        description="Your trip is completed, thank you for using our service!"
      >
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Go back
        </Button>
      </TripOverviewCard>
    )
  }

  if (status === TripEvents.Cancelled) {
    return (
      <TripOverviewCard
        title="Trip cancelled!"
        description="Your trip is cancelled, please try again later"
      >
        <Button variant="outline" className="w-full" onClick={onCancel}>
          Go back
        </Button>
      </TripOverviewCard>
    )
  }

  if (status === TripEvents.Created) {
    return (
      <TripOverviewCard
        title="Looking for a driver"
        description="Your trip is confirmed! We&apos;re matching you with a driver, it should not take long."
      >
        <div className="flex flex-col space-y-3 justify-center items-center mb-4">
          <Skeleton className="h-[125px] w-[250px] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
          {trip?.duration &&
            <h3 className="text-sm font-medium text-gray-700 mb-2">Arriving in: {convertSecondsToMinutes(trip?.duration)} at your destination ({convertMetersToKilometers(trip?.distance ?? 0)})</h3>
          }

          <Button variant="destructive" className="w-full" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </TripOverviewCard>
    )
  }

  if (trip.rideFares && trip.rideFares.length >= 0 && !trip.tripID) {
    return (
      <DriverList
        trip={trip}
        onPackageSelect={onPackageSelect}
        onCancel={onCancel}
      />
    )
  }

  return (
    <Card className="w-full md:max-w-[500px] z-[9999] flex-[0.3]">
      No trip ride fares, please refresh the page
    </Card>
  )
}