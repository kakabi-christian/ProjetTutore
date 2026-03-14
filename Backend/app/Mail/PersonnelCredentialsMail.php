<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PersonnelCredentialsMail extends Mailable
{
    use Queueable, SerializesModels;

    // On déclare les variables publiques pour qu'elles soient accessibles dans la vue Blade
    public $personnel;
    public $plainPassword;

    /**
     * Create a new message instance.
     */
    public function __construct($personnel, $plainPassword)
    {
        $this->personnel = $personnel;
        $this->plainPassword = $plainPassword;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Vos identifiants de connexion - Système Académique',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.personnel_credentials', // Assure-toi de créer ce fichier dans resources/views/emails/
        );
    }

    /**
     * Get the attachments for the message.
     */
    public function attachments(): array
    {
        return [];
    }
}