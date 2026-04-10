    <?php

    use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('listings', function (Blueprint $table) {
            $table->id('listing_id');

            // Relation avec l'utilisateur
            $table->unsignedBigInteger('user_id');
            $table->foreign('user_id')->references('user_id')->on('utilisateurs')->onDelete('cascade');
            // ✅ LE COMPTE DE RÉCEPTION (Important : C'est ici que Flutterwave enverra l'argent final)
            $table->unsignedBigInteger('method_payment_id');
            $table->foreign('method_payment_id')->references('method_payment_id')->on('method_payments');

            // Détails de la transaction
            $table->string('currency_from', 3); // Code ISO (ex: USD, XAF)
            $table->string('currency_to', 3);   // Code ISO (ex: EUR, CAD)

            // On utilise decimal(15,2) pour la précision financière (évite les erreurs de float)
            $table->decimal('amount_available', 15, 2);
            $table->decimal('min_amount', 15, 2)->nullable(); // Optionnel : montant min accepté pour un échange partiel

            // Gestion des taux
            $table->decimal('official_rate', 15, 4); // Le taux récupéré via l'API Massive au moment du post
            $table->decimal('user_rate', 15, 4);     // Le taux personnalisé par l'user (souvent <= official_rate)

            // Social & Design (Le côté "Instagram/Facebook")
            // On ne stocke pas d'image lourde, mais une référence pour le front (ex: 'gradient-blue', 'urgent-red')
            $table->string('visual_theme')->default('default');
            $table->text('description')->nullable(); // Un petit mot du vendeur pour rassurer

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('listings');
    }
};
