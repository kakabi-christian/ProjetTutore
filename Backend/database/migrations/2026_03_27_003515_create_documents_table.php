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
        Schema::create('documents', function (Blueprint $table) {
            $table->id('document_id');

            $table->unsignedBigInteger('kyc_id');
            $table->string('country_of_issue', 50);
            $table->foreign('kyc_id')->references('kyc_id')->on('kycs')->onDelete('cascade');
            $table->unsignedBigInteger('type_document_id');
            $table->foreign('type_document_id')->references('type_document_id')->on('type_documents')->onDelete('cascade');
            $table->string('file_url');
            $table->enum('status', ['PENDING', 'APPROVED', 'REJECTED'])->default('PENDING');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
