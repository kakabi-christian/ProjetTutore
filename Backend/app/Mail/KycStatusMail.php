<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class KycStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;

    public $status; // 'APPROVED' ou 'REJECTED'

    public $reason; // Sera null en cas d'approbation

    /**
     * Create a new message instance.
     */
    public function __construct($userName, $status, $reason = null)
    {
        $this->userName = $userName;
        $this->status = $status;
        $this->reason = $reason;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        // Le sujet change selon le statut pour être plus pro
        $subject = $this->status === 'APPROVED'
            ? '✅ Félicitations ! Votre KYC ExchaPay est validé'
            : '❌ Information importante concernant votre KYC ExchaPay';

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.kyc_status', // Assure-toi de créer ce fichier dans resources/views/emails/
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
