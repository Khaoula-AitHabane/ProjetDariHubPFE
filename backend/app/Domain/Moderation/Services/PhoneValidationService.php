<?php

namespace App\Domain\Moderation\Services;

class PhoneValidationService
{
    // Moroccan mobile prefixes (06x, 07x) and landline (05x)
    private const VALID_PREFIXES = ['06', '07', '05'];

    // Obviously fake / test numbers
    private const SUSPICIOUS_PATTERNS = [
        '/^(.)\1{7,}$/',              // e.g. 0666666666 (same digit repeating)
        '/^(01|02|03|04|09)\d{8}$/', // Invalid Moroccan starting digits
        '/^0{5,}/',                   // too many zeros
    ];

    public function analyze(string $phone): array
    {
        $clean = preg_replace('/[\s\-\.\(\)+]/', '', $phone);

        // Normalize international prefix +212 -> 0
        if (str_starts_with($clean, '212')) {
            $clean = '0' . substr($clean, 3);
        } elseif (str_starts_with($clean, '+212')) {
            $clean = '0' . substr($clean, 4);
        }

        if (strlen($clean) < 8) {
            return ['valid' => false, 'suspicious' => true, 'reason' => 'Numéro trop court'];
        }

        if (strlen($clean) > 15) {
            return ['valid' => false, 'suspicious' => true, 'reason' => 'Numéro trop long'];
        }

        // Check for suspicious patterns
        foreach (self::SUSPICIOUS_PATTERNS as $pattern) {
            if (preg_match($pattern, $clean)) {
                return ['valid' => false, 'suspicious' => true, 'reason' => 'Numéro suspect ou fictif'];
            }
        }

        // Check Moroccan prefix
        $hasValidPrefix = false;
        foreach (self::VALID_PREFIXES as $prefix) {
            if (str_starts_with($clean, $prefix)) {
                $hasValidPrefix = true;
                break;
            }
        }

        if (! $hasValidPrefix) {
            return ['valid' => false, 'suspicious' => true, 'reason' => 'Préfixe téléphonique invalide pour le Maroc'];
        }

        return ['valid' => true, 'suspicious' => false, 'reason' => null];
    }
}
