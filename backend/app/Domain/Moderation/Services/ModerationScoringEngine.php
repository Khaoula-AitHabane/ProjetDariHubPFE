<?php

namespace App\Domain\Moderation\Services;

/**
 * Fast local pre-checks before calling Gemini.
 * Returns a list of pre-detected issues that will be included in the final result.
 */
class ModerationScoringEngine
{
    // Offensive / spam keywords in FR + Darija
    private const SPAM_KEYWORDS = [
        'gagnez', 'gagner', 'cliquez ici', 'gratuit', 'argent facile',
        'investissement garanti', '1000%', 'offre limitée', 'urgent urgent urgent',
        'whatsapp', 'telegram', 'rejoignez', 'arnaque', 'escroquerie',
        'promo exclusive', 'doublez', 'triplez',
    ];

    private const INSULT_KEYWORDS = [
        'idiot', 'imbécile', 'con', 'crétin', 'nul', 'salaud',
        'merde', 'putain', 'bâtard', 'connard',
    ];

    public function analyze(string $title, string $description, float $price): array
    {
        $issues  = [];
        $score   = 0;
        $fullText = strtolower($title . ' ' . $description);

        // --- Length checks ---
        if (strlen(trim($title)) < 10) {
            $issues[] = 'Titre trop court (moins de 10 caractères)';
            $score    += 20;
        }

        if (strlen(trim($description)) < 30) {
            $issues[] = 'Description trop courte (moins de 30 caractères)';
            $score    += 25;
        }

        // --- Repetition check ---
        $words      = preg_split('/\s+/', trim($fullText));
        $wordCount  = count($words);
        $uniqueWords = count(array_unique($words));
        if ($wordCount > 5 && $uniqueWords / $wordCount < 0.4) {
            $issues[] = 'Texte très répétitif';
            $score    += 30;
        }

        // --- Spam keyword check ---
        foreach (self::SPAM_KEYWORDS as $keyword) {
            if (str_contains($fullText, strtolower($keyword))) {
                $issues[] = "Mot-clé spam détecté: \"{$keyword}\"";
                $score    += 20;
                break; // one penalty per batch
            }
        }

        // --- Insult check ---
        foreach (self::INSULT_KEYWORDS as $keyword) {
            if (str_contains($fullText, strtolower($keyword))) {
                $issues[] = "Contenu offensant détecté";
                $score    += 40;
                break;
            }
        }

        // --- Price check ---
        if ($price <= 0) {
            $issues[] = 'Prix invalide ou nul';
            $score    += 10;
        }

        if ($price > 1_000_000) {
            $issues[] = 'Prix anormalement élevé';
            $score    += 15;
        }

        // --- All caps check ---
        $lettersOnly = preg_replace('/[^a-zA-Z]/', '', $title);
        if (strlen($lettersOnly) > 5 && $lettersOnly === strtoupper($lettersOnly)) {
            $issues[] = 'Titre entièrement en majuscules (pratique spam)';
            $score    += 10;
        }

        return [
            'pre_score'  => min(100, $score),
            'pre_issues' => $issues,
        ];
    }
}
