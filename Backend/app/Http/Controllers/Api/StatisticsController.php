<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StatisticsRequest;
use App\Models\Utilisateur;
use App\Models\Transaction;
use App\Models\Listing;
use App\Models\Review;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatisticsController extends Controller
{
    /**
     * STATS GLOBALES (Dashboard Admin)
     */
    public function index(StatisticsRequest $request)
    {
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->subMonth();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

        $userStats = [
            'total_users' => Utilisateur::count(),
            'verified_users' => Utilisateur::where('isverified', true)->count(),
            'new_users_period' => Utilisateur::whereBetween('created_at', [$startDate, $endDate])->count(),
        ];

        $transactionStats = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('COUNT(*) as total_count'),
                DB::raw('SUM(CASE WHEN status = "COMPLETED" THEN 1 ELSE 0 END) as completed_count'),
                DB::raw('SUM(amount_from) as total_volume_from'),
                DB::raw('SUM(buyer_fee + seller_fee) as total_revenue')
            )
            ->first();

        $listingStats = [
            'active_listings' => Listing::whereHas('histories.listingStatus', function($q) {
                $q->where('title', 'active');
            })->count(),
            'total_listings_period' => Listing::whereBetween('created_at', [$startDate, $endDate])->count(),
        ];

        $dailyTrend = Transaction::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'COMPLETED')
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(amount_from) as volume')
            )
            ->groupBy('date')
            ->orderBy('date', 'ASC')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'users' => $userStats,
                'transactions' => [
                    'total' => $transactionStats->total_count ?? 0,
                    'completed' => $transactionStats->completed_count ?? 0,
                    'volume' => round($transactionStats->total_volume_from ?? 0, 2),
                    'revenue' => round($transactionStats->total_revenue ?? 0, 2),
                    'success_rate' => $transactionStats->total_count > 0 
                        ? round(($transactionStats->completed_count / $transactionStats->total_count) * 100, 2) 
                        : 0,
                ],
                'listings' => $listingStats,
                'chart_data' => $dailyTrend
            ]
        ]);
    }

    /**
     * STATS PERSONNELLES (Dashboard Utilisateur)
     * Filtre par période inclus.
     */
    public function userStats(StatisticsRequest $request)
    {
        $user = auth()->user();
        $userId = $user->user_id;

        // Gestion des périodes (Par défaut : année en cours)
        $startDate = $request->start_date ? Carbon::parse($request->start_date) : Carbon::now()->startOfYear();
        $endDate = $request->end_date ? Carbon::parse($request->end_date) : Carbon::now();

        // 1. Volume d'échange et Économies réalisées
        // On calcule l'économie par rapport au taux officiel
        $myTransactions = Transaction::where(function($q) use ($userId) {
                $q->where('buyer_id', $userId)->orWhere('seller_id', $userId);
            })
            ->where('status', 'COMPLETED')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        $totalVolume = $myTransactions->sum('amount_from');
        
        // 2. Calcul de la fiabilité (Rating moyen)
        $averageRating = Review::whereHas('listing', function($q) use ($userId) {
            $q->where('user_id', $userId);
        })->avg('rating') ?? 5.0;

        // 3. Activité par mois (pour graphique linéaire personnel)
        $monthlyActivity = Transaction::where(function($q) use ($userId) {
                $q->where('buyer_id', $userId)->orWhere('seller_id', $userId);
            })
            ->where('status', 'COMPLETED')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->select(
                DB::raw('MONTH(created_at) as month'),
                DB::raw('SUM(amount_from) as volume'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('month')
            ->orderBy('month', 'ASC')
            ->get();

        // 4. Comparaison avec l'année dernière (Growth)
        $lastYearVolume = Transaction::where(function($q) use ($userId) {
                $q->where('buyer_id', $userId)->orWhere('seller_id', $userId);
            })
            ->where('status', 'COMPLETED')
            ->whereBetween('created_at', [
                Carbon::parse($startDate)->subYear(), 
                Carbon::parse($endDate)->subYear()
            ])
            ->sum('amount_from');

        $growth = $lastYearVolume > 0 
            ? round((($totalVolume - $lastYearVolume) / $lastYearVolume) * 100, 2) 
            : 100;

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_volume' => round($totalVolume, 2),
                    'transactions_count' => $myTransactions->count(),
                    'average_rating' => round($averageRating, 1),
                    'growth_percentage' => $growth,
                ],
                'listings' => [
                    'total' => Listing::where('user_id', $userId)->count(),
                    'active' => Listing::where('user_id', $userId)->whereHas('histories.listingStatus', function($q) {
                        $q->where('title', 'active');
                    })->count(),
                ],
                'chart_data' => $monthlyActivity,
                'period' => [
                    'from' => $startDate->toDateString(),
                    'to' => $endDate->toDateString()
                ]
            ]
        ]);
    }
}