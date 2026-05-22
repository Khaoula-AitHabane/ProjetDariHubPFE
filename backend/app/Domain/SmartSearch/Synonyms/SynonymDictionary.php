<?php

namespace App\Domain\SmartSearch\Synonyms;

class SynonymDictionary
{
    private array $dictionary = [
        'maison' => ['dar', 'manzil', 'house'],
        'appartement' => ['apparte', 'appart', 'chqa', 'barrtma', 'bartma', 'apartment'],
        'villa' => ['vila', 'filah'],
        'chambre' => ['bit', 'ghorfa', 'room', 'khamiya', 'chambers'],
        'location' => ['kra', 'lakra', 'rent', 'ikra'],
        'vente' => ['bi3', 'lbi3', 'sale'],
        'canapé' => ['saderi', 'salon', 'fotaute', 'sofa'],
        'bricolage' => ['brikolaj', 'bricoulage', 'brikol', 'diy'],
        'plombier' => ['plombi', 'rصاص', 'plumber'],
        'electricien' => ['trisian', 'kahraba2i', 'electrician'],
        'menuisier' => ['njar', 'najjar', 'carpenter'],
    ];

    public function normalize(string $query): string
    {
        $query = strtolower($query);

        // Very basic typo correction for single words using levenshtein or direct replacement
        foreach ($this->dictionary as $standard => $synonyms) {
            foreach ($synonyms as $synonym) {
                // If the word exists in the query, replace it with the standard term
                // We use word boundaries \b
                $pattern = '/\b' . preg_quote($synonym, '/') . '\b/i';
                $query = preg_replace($pattern, $standard, $query);
            }
        }

        return $query;
    }
}
