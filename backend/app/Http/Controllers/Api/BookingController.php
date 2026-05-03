<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $bookings = Booking::query()
            ->with([
                'service:id,title,service_type,location_city,price,billing_unit',
                'client:id,name,email,phone,city',
                'provider:id,name,phone,city',
            ])
            ->when(
                $request->string('status')->toString(),
                fn ($query, string $status) => $query->where('status', $status),
            )
            ->latest()
            ->get();

        return response()->json([
            'data' => $bookings->map(fn (Booking $booking) => $this->transformBooking($booking))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'service_id' => ['required', 'exists:services,id'],
            'client_name' => ['required', 'string', 'max:255'],
            'client_email' => ['required', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:30'],
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:30'],
            'payment_method' => ['nullable', 'string', 'max:30'],
            'service_address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $service = Service::query()->with('provider')->findOrFail($validated['service_id']);

        $client = User::query()->firstOrCreate(
            ['email' => $validated['client_email']],
            [
                'name' => $validated['client_name'],
                'password' => Str::password(12),
                'role' => 'client',
                'phone' => $validated['client_phone'] ?? null,
                'city' => $service->location_city,
            ],
        );

        if (! $client->phone && ! empty($validated['client_phone'])) {
            $client->update(['phone' => $validated['client_phone']]);
        }

        $booking = Booking::query()->create([
            'service_id' => $service->id,
            'client_id' => $client->id,
            'provider_id' => $service->provider_id,
            'booking_reference' => $this->generateReference(),
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'] ?? $validated['start_date'],
            'quantity' => $validated['quantity'] ?? 1,
            'total_amount' => $this->calculateTotalAmount(
                $service,
                $validated['start_date'],
                $validated['end_date'] ?? null,
                (int) ($validated['quantity'] ?? 1),
            ),
            'status' => 'pending',
            'payment_status' => 'unpaid',
            'payment_method' => $validated['payment_method'] ?? 'cash',
            'service_address' => $validated['service_address'] ?? $service->location_address,
            'notes' => $validated['notes'] ?? null,
        ]);

        $booking->load([
            'service:id,title,service_type,location_city,price,billing_unit',
            'client:id,name,email,phone,city',
            'provider:id,name,phone,city',
        ]);

        return response()->json([
            'message' => 'Reservation enregistree avec succes.',
            'data' => $this->transformBooking($booking),
        ], 201);
    }

    private function calculateTotalAmount(Service $service, string $startDate, ?string $endDate, int $quantity): float
    {
        if ($service->service_type === 'home_service') {
            return (float) $service->price * $quantity;
        }

        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate ?? $startDate);
        $days = max(1, $start->diffInDays($end) + 1);

        return (float) $service->price * $days * $quantity;
    }

    private function generateReference(): string
    {
        do {
            $reference = 'PFE-'.strtoupper(Str::random(8));
        } while (Booking::query()->where('booking_reference', $reference)->exists());

        return $reference;
    }

    private function transformBooking(Booking $booking): array
    {
        return [
            'id' => $booking->id,
            'booking_reference' => $booking->booking_reference,
            'start_date' => optional($booking->start_date)->toDateString(),
            'end_date' => optional($booking->end_date)->toDateString(),
            'quantity' => $booking->quantity,
            'total_amount' => (float) $booking->total_amount,
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'payment_method' => $booking->payment_method,
            'service_address' => $booking->service_address,
            'notes' => $booking->notes,
            'service' => $booking->service,
            'client' => $booking->client,
            'provider' => $booking->provider,
        ];
    }
}
