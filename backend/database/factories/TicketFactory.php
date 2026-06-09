<?php

namespace Database\Factories;

use App\Models\Helpdesk\Ticket;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Ticket>
 */
class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    public function definition(): array
    {
        return [
            'external_id' => (string) fake()->unique()->numberBetween(1000, 99999),
            'title' => fake()->sentence(6),
            'description' => fake()->paragraph(),
            'type' => fake()->randomElement(config('helpdesk.types')),
            'priority' => fake()->randomElement(config('helpdesk.priorities')),
            'status' => 'received',
            'requester_name' => fake()->name(),
            'requester_email' => fake()->safeEmail(),
            'external_system' => 'sistema-cliente',
            'payload_original' => ['source' => 'factory'],
        ];
    }
}
