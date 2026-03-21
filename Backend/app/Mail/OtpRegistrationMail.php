<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpRegistrationMail extends Mailable
{
    use Queueable, SerializesModels;

    // On définit les variables publiques pour qu'elles soient accessibles dans la vue Blade
    public $name;
    public $otp;

    /**
     * Le constructeur reçoit les données du Controller
     */
    public function __construct($name, $otp)
    {
        $this->name = $name;
        $this->otp = $otp;
    }

    /**
     * Définit l'objet de l'email
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '✅ Confirmation d\'inscription - Code OTP ExchaPay',
        );
    }

    /**
     * Définit la vue HTML (on va l'appeler emails.registration_otp)
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.registration_otp',
        );
    }

    /**
     * Pas de pièces jointes pour le moment
     */
    public function attachments(): array
    {
        return [];
    }
}